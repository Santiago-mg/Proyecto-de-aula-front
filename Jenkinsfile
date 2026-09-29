// ─────────────────────────────────────────────────────────────────────────────
// Pipeline del FRONTEND de CelularPro              (job en Jenkins: celularpro-front)
//
//   Entorno → Instalar dependencias → Typecheck → Pruebas y cobertura
//          → SonarQube (análisis + Quality Gate) → Build → Imagen Docker
//
// Mismo agente (Dockerfile.jenkins) y mismas etapas que el backend.
// Este job NO despliega: el despliegue (Docker + Vercel) lo hace el
// orquestador (Jenkinsfile.orquestador) cuando el back y el front pasaron todo.
//
// Plugins: Pipeline, Git, Docker Pipeline, SonarQube Scanner, JUnit, Timestamper
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent {
        dockerfile {
            filename 'Dockerfile.jenkins'
            // Socket de Docker del host: para construir la imagen del front.
            // -u root: para poder usar ese socket dentro del contenedor.
            args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
        }
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        string(
            name: 'VITE_API_URL',
            defaultValue: 'http://localhost:3001/api/v1',
            description: 'URL de la API. Vite la graba dentro del front al compilar.'
        )
    }

    environment {
        // CI=true: Vitest genera además reports/junit.xml (ver vitest.config.ts)
        CI           = 'true'
        IMAGEN       = 'celularpro-front'
        VITE_API_URL = "${params.VITE_API_URL}"
    }

    stages {

        stage('Entorno') {
            steps {
                sh '''
                    node --version
                    npm --version
                    docker --version
                '''
            }
        }

        stage('Instalar dependencias') {
            steps {
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('Typecheck') {
            steps {
                // Revisa los tipos de src/ y también de test/.
                sh 'npm run typecheck'
            }
        }

        stage('Pruebas y cobertura') {
            steps {
                // Suite de regresión: test/escenarios (los casos de los
                // escenarios del back vistos desde la interfaz) + test/unit.
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml', allowEmptyResults: true
                }
            }
        }

        stage('SonarQube') {
            steps {
                // Igual que en el backend: servidor 'SonarQube' de Jenkins y
                // el scanner espera el Quality Gate (si no pasa, se detiene).
                withSonarQubeEnv('SonarQube') {
                    sh 'npx --yes sonarqube-scanner@5 -Dsonar.qualitygate.wait=true'
                }
            }
        }

        stage('Build') {
            steps {
                // tsc + vite build, con la VITE_API_URL del parámetro.
                sh 'npm run build'
            }
        }

        stage('Imagen Docker') {
            steps {
                // La usa el orquestador para levantar la app con Docker.
                sh '''
                    docker build \
                        --build-arg VITE_API_URL="$VITE_API_URL" \
                        -t "$IMAGEN:$BUILD_NUMBER" \
                        -t "$IMAGEN:latest" \
                        .
                '''
            }
        }
    }

    post {
        success {
            echo "Frontend OK: pruebas, SonarQube e imagen ${env.IMAGEN}:${env.BUILD_NUMBER} listos."
        }
        failure {
            echo 'Frontend FALLÓ: revisa la etapa en rojo. El orquestador no despliega.'
        }
        always {
            // Igual que en el backend: borra lo generado, desde el contenedor.
            sh 'rm -rf node_modules dist coverage reports .scannerwork'
        }
    }
}
