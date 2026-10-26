import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { Loading } from '../../components/ui/Loading'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useToastOpcional } from '../../context/ToastContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { phonesService } from '../../services/phones.service'
import type { PhoneFormData } from '../../types/phone'
import { comoError } from '../../utils/errores'

const schema = z.object({
  slug: z.string().min(3, 'Mínimo 3 caracteres'),
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  brand: z.string().min(2, 'Requerido'),
  categoryId: z.string().min(1, 'Requerido'),
  price: z.coerce.number().int().positive('Debe ser positivo'),
  compareAt: z.coerce.number().int().positive('Debe ser positivo').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  badge: z.string().optional(),
  stock: z.coerce.number().int().nonnegative('No puede ser negativo'),
  condition: z.enum(['NEW', 'CERTIFIED', 'USED']),
  verified: z.boolean(),
  batteryHealth: z.coerce.number().int().min(0, 'Entre 0 y 100').max(100, 'Entre 0 y 100').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  ram: z.string().optional(),
  storage: z.string().optional(),
  camera: z.string().optional(),
  battery: z.string().optional(),
  screen: z.string().optional(),
  chip: z.string().optional(),
  shortDesc: z.string().optional(),
  longDesc: z.string().optional(),
  heroImage: z.string().url('URL inválida').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  featuresText: z.string().optional(),
})

type FormFields = z.infer<typeof schema>

// Etiqueta + control + ayuda + mensaje de error de un campo del formulario
function Field({
  id,
  label,
  error,
  ayuda,
  requerido = false,
  children,
}: Readonly<{
  id: string
  label: string
  error?: string
  /** Qué escribir aquí, visible siempre (el placeholder desaparece al teclear). */
  ayuda?: string
  requerido?: boolean
  children: ReactNode
}>) {
  return (
    <div className="cp-field">
      <label htmlFor={id} className={requerido ? 'cp-label requerido' : 'cp-label'}>{label}</label>
      {children}
      {ayuda && <p id={`${id}-ayuda`} className="cp-field-hint">{ayuda}</p>}
      {error && <p id={`${id}-error`} className="cp-field-error">{error}</p>}
    </div>
  )
}

// Enlaza el control con su ayuda y su error para el lector de pantalla.
function enlazar(id: string, error?: string, conAyuda = false, requerido = false) {
  const descrito = [conAyuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(' ')
  return {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': descrito || undefined,
    'aria-required': requerido ? (true as const) : undefined,
  }
}

function textoDelBoton(isSubmitting: boolean, isEdit: boolean) {
  if (isSubmitting) return 'Guardando...'
  return isEdit ? 'Guardar cambios' : 'Crear celular'
}

export function PhoneForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  useDocumentTitle(isEdit ? 'Administración · Editar celular' : 'Administración · Nuevo celular')
  const navigate = useNavigate()
  const avisar = useToastOpcional()
  const [loading, setLoading] = useState(isEdit)
  const [serverError, setServerError] = useState<Error | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!isEdit || !id) return
    phonesService
      .getById(id)
      .then((phone) => {
        reset({
          slug: phone.slug,
          name: phone.name,
          brand: phone.brand,
          categoryId: phone.categoryId,
          price: phone.price,
          compareAt: phone.compareAt ?? undefined,
          badge: phone.badge ?? undefined,
          stock: phone.stock,
          condition: phone.condition,
          verified: phone.verified,
          batteryHealth: phone.batteryHealth ?? undefined,
          ram: phone.ram ?? undefined,
          storage: phone.storage ?? undefined,
          camera: phone.camera ?? undefined,
          battery: phone.battery ?? undefined,
          screen: phone.screen ?? undefined,
          chip: phone.chip ?? undefined,
          shortDesc: phone.shortDesc ?? undefined,
          longDesc: phone.longDesc ?? undefined,
          heroImage: phone.heroImage ?? undefined,
          featuresText: phone.features.join('\n'),
        })
      })
      .catch((err) => {
        // El formulario queda vacío y se explica por qué (p. ej. 404 Celular no encontrado)
        setServerError(comoError(err))
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, reset])

  async function onSubmit(fields: FormFields) {
    setServerError(null)
    const features = (fields.featuresText ?? '')
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    const data: PhoneFormData = {
      slug: fields.slug,
      name: fields.name,
      brand: fields.brand,
      categoryId: fields.categoryId,
      price: fields.price,
      compareAt: typeof fields.compareAt === 'number' ? fields.compareAt : undefined,
      badge: fields.badge,
      stock: fields.stock,
      condition: fields.condition,
      verified: fields.verified,
      batteryHealth: typeof fields.batteryHealth === 'number' ? fields.batteryHealth : undefined,
      ram: fields.ram,
      storage: fields.storage,
      camera: fields.camera,
      battery: fields.battery,
      screen: fields.screen,
      chip: fields.chip,
      shortDesc: fields.shortDesc,
      longDesc: fields.longDesc,
      heroImage: typeof fields.heroImage === 'string' ? fields.heroImage : undefined,
      features,
    }

    try {
      if (isEdit && id) {
        await phonesService.update(id, data)
      } else {
        await phonesService.create(data)
      }
      avisar.showToast(isEdit ? `Guardamos los cambios de «${data.name}».` : `Creamos «${data.name}» en el catálogo.`)
      navigate('/admin/phones')
    } catch (err) {
      setServerError(comoError(err))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="cp-admin-page cp-admin-form">
      <Breadcrumbs
        migas={[
          { etiqueta: 'Panel', to: '/admin' },
          { etiqueta: 'Celulares', to: '/admin/phones' },
          { etiqueta: isEdit ? 'Editar celular' : 'Nuevo celular' },
        ]}
      />

      <h1 className="cp-admin-page-title cp-admin-form-title">
        {isEdit ? 'Editar celular' : 'Nuevo celular'}
      </h1>
      <p className="cp-form-note">Los campos marcados con * son obligatorios.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="cp-field-row">
          <Field id="name" label="Nombre" error={errors.name?.message} requerido>
            <input id="name" className={`cp-input ${errors.name ? 'error' : ''}`}
              placeholder="iPhone 15 Pro 256GB"
              {...enlazar('name', errors.name?.message, false, true)} {...register('name')} />
          </Field>
          <Field
            id="slug"
            label="Slug (URL)"
            error={errors.slug?.message}
            ayuda="Va en la dirección web del celular, por ejemplo /phones/iphone-15-pro-256gb."
            requerido
          >
            <input id="slug" className={`cp-input ${errors.slug ? 'error' : ''}`}
              placeholder="iphone-15-pro-256gb"
              autoCapitalize="none" spellCheck={false}
              {...enlazar('slug', errors.slug?.message, true, true)} {...register('slug')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field id="brand" label="Marca" error={errors.brand?.message} requerido>
            <input id="brand" className={`cp-input ${errors.brand ? 'error' : ''}`}
              placeholder="Apple"
              {...enlazar('brand', errors.brand?.message, false, true)} {...register('brand')} />
          </Field>
          <Field id="categoryId" label="Categoría" error={errors.categoryId?.message} requerido>
            <select id="categoryId" className={`cp-select ${errors.categoryId ? 'error' : ''}`}
              {...enlazar('categoryId', errors.categoryId?.message, false, true)} {...register('categoryId')}>
              <option value="">Seleccionar...</option>
              <option value="apple">iPhone (Apple)</option>
              <option value="samsung">Samsung</option>
              <option value="xiaomi">Xiaomi</option>
              <option value="motorola">Motorola</option>
            </select>
          </Field>
        </div>

        <div className="cp-field-row">
          <Field
            id="price"
            label="Precio (COP)"
            error={errors.price?.message}
            ayuda="En pesos colombianos, solo números."
            requerido
          >
            <input id="price" type="number" inputMode="numeric" className={`cp-input ${errors.price ? 'error' : ''}`}
              placeholder="2500000"
              {...enlazar('price', errors.price?.message, true, true)} {...register('price')} />
          </Field>
          <Field
            id="compareAt"
            label="Precio tachado (opcional)"
            error={errors.compareAt?.message}
            ayuda="El precio anterior: se muestra tachado junto al actual."
          >
            <input id="compareAt" type="number" inputMode="numeric" className={`cp-input ${errors.compareAt ? 'error' : ''}`}
              placeholder="3000000"
              {...enlazar('compareAt', errors.compareAt?.message, true)} {...register('compareAt')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field
            id="stock"
            label="Stock"
            error={errors.stock?.message}
            ayuda="Unidades disponibles. Con 0 el celular aparece como agotado."
            requerido
          >
            <input id="stock" type="number" inputMode="numeric" className={`cp-input ${errors.stock ? 'error' : ''}`}
              placeholder="5"
              {...enlazar('stock', errors.stock?.message, true, true)} {...register('stock')} />
          </Field>
          <Field id="condition" label="Condición" error={errors.condition?.message}>
            <select id="condition" className="cp-select"
              {...enlazar('condition', errors.condition?.message)} {...register('condition')}>
              <option value="NEW">Nuevo</option>
              <option value="CERTIFIED">Certificado</option>
              <option value="USED">Usado verificado</option>
            </select>
          </Field>
        </div>

        <div className="cp-field-row">
          <Field
            id="batteryHealth"
            label="Salud de batería % (opcional)"
            error={errors.batteryHealth?.message}
            ayuda="Porcentaje de 0 a 100."
          >
            <input id="batteryHealth" type="number" inputMode="numeric" className={`cp-input ${errors.batteryHealth ? 'error' : ''}`}
              placeholder="91" min="0" max="100"
              {...enlazar('batteryHealth', errors.batteryHealth?.message, true)} {...register('batteryHealth')} />
          </Field>
          <Field
            id="heroImage"
            label="URL imagen principal"
            error={errors.heroImage?.message}
            ayuda="Dirección completa de la imagen, empezando por https://"
          >
            <input id="heroImage" type="url" className={`cp-input ${errors.heroImage ? 'error' : ''}`}
              placeholder="https://..." autoCapitalize="none" spellCheck={false}
              {...enlazar('heroImage', errors.heroImage?.message, true)} {...register('heroImage')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field id="storage" label="Almacenamiento">
            <input id="storage" className="cp-input" placeholder="256GB" {...register('storage')} />
          </Field>
          <Field id="ram" label="RAM">
            <input id="ram" className="cp-input" placeholder="8GB" {...register('ram')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field id="chip" label="Procesador">
            <input id="chip" className="cp-input" placeholder="A17 Pro" {...register('chip')} />
          </Field>
          <Field id="camera" label="Cámara">
            <input id="camera" className="cp-input" placeholder="48MP + 12MP" {...register('camera')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field id="screen" label="Pantalla">
            <input id="screen" className="cp-input" placeholder='6.7" OLED 120Hz' {...register('screen')} />
          </Field>
          <Field id="battery" label="Batería">
            <input id="battery" className="cp-input" placeholder="4422 mAh" {...register('battery')} />
          </Field>
        </div>

        <div className="cp-field-row">
          <Field
            id="badge"
            label="Badge (opcional)"
            ayuda="Etiqueta corta sobre la tarjeta, como Oferta o Nuevo."
          >
            <input id="badge" className="cp-input" placeholder="Oferta, Nuevo, etc."
              {...enlazar('badge', undefined, true)} {...register('badge')} />
          </Field>
          <div className="cp-field cp-check-field">
            <input id="verified" type="checkbox" className="cp-check" {...register('verified')} />
            <label htmlFor="verified" className="cp-label cp-label-inline">
              Equipo verificado ✓
            </label>
          </div>
        </div>

        <Field id="shortDesc" label="Descripción corta">
          <textarea id="shortDesc" className="cp-input cp-textarea" rows={2}
            placeholder="Descripción breve para el catálogo..." {...register('shortDesc')} />
        </Field>

        <Field id="longDesc" label="Descripción larga">
          <textarea id="longDesc" className="cp-input cp-textarea" rows={4}
            placeholder="Descripción completa..." {...register('longDesc')} />
        </Field>

        <Field id="featuresText" label="Características (una por línea)">
          <textarea id="featuresText" className="cp-input cp-textarea cp-textarea-mono" rows={5}
            placeholder={"Chip A17 Pro\nCámara 48MP\nBluetooth 5.3"}
            {...register('featuresText')} />
        </Field>

        {serverError && <ErrorMessage error={serverError} />}

        <div className="cp-form-actions">
          <button
            type="submit"
            className="cp-btn cp-btn-primary"
            disabled={isSubmitting}
          >
            {textoDelBoton(isSubmitting, isEdit)}
          </button>
          <button
            type="button"
            className="cp-btn cp-btn-secondary"
            onClick={() => navigate('/admin/phones')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
