
import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const INITIAL_FORM = {
  Age: '52',
  Sex: 'M',
  ChestPainType: 'ATA',
  RestingBP: '130',
  Cholesterol: '220',
  FastingBS: '0',
  RestingECG: 'Normal',
  MaxHR: '150',
  ExerciseAngina: 'N',
  Oldpeak: '0.5',
  ST_Slope: 'Up',
}

const FIELDS = [
  {
    name: 'Age',
    label: 'Age',
    type: 'number',
    min: 18,
    max: 120,
    suffix: 'years',
  },
  {
    name: 'Sex',
    label: 'Sex',
    options: [['M', 'Male'], ['F', 'Female']],
  },
  {
    name: 'ChestPainType',
    label: 'Chest pain type',
    options: [
      ['TA', 'Typical angina'],
      ['ATA', 'Atypical angina'],
      ['NAP', 'Non-anginal pain'],
      ['ASY', 'Asymptomatic'],
    ],
  },
  {
    name: 'RestingBP',
    label: 'Resting blood pressure',
    type: 'number',
    min: 1,
    max: 300,
    suffix: 'mmHg',
  },
  {
    name: 'Cholesterol',
    label: 'Cholesterol',
    type: 'number',
    min: 0,
    max: 1000,
    suffix: 'mg/dL',
  },
  {
    name: 'FastingBS',
    label: 'Fasting blood sugar > 120 mg/dL',
    options: [['0', 'No'], ['1', 'Yes']],
  },
  {
    name: 'RestingECG',
    label: 'Resting ECG',
    options: [
      ['Normal', 'Normal'],
      ['ST', 'ST abnormality'],
      ['LVH', 'LVH'],
    ],
  },
  {
    name: 'MaxHR',
    label: 'Maximum heart rate',
    type: 'number',
    min: 1,
    max: 250,
    suffix: 'bpm',
  },
  {
    name: 'ExerciseAngina',
    label: 'Exercise-induced angina',
    options: [['N', 'No'], ['Y', 'Yes']],
  },
  {
    name: 'Oldpeak',
    label: 'Oldpeak',
    type: 'number',
    min: -10,
    max: 15,
    step: 0.1,
  },
  {
    name: 'ST_Slope',
    label: 'ST slope',
    options: [
      ['Up', 'Upsloping'],
      ['Flat', 'Flat'],
      ['Down', 'Downsloping'],
    ],
  },
]

const SAMPLE_ACTIVITY = [
  { day: 'Mon', requests: 12 },
  { day: 'Tue', requests: 19 },
  { day: 'Wed', requests: 15 },
  { day: 'Thu', requests: 28 },
  { day: 'Fri', requests: 22 },
  { day: 'Sat', requests: 35 },
  { day: 'Sun', requests: 30 },
]

function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-[#101c2b] ${className}`}
    >
      {children}
    </section>
  )
}

function Field({ field, value, onChange }) {
  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-700 bg-[#091523] px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10'

  return (
    <label className="block min-w-0 text-sm text-slate-400">
      <span>{field.label}</span>

      {field.options ? (
        <select
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options.map(([optionValue, label]) => (
            <option key={optionValue} value={optionValue}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={inputClass}
          type="number"
          required
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.suffix && (
        <span className="mt-1 block text-[11px] text-slate-600">
          Unit: {field.suffix}
        </span>
      )}
    </label>
  )
}

function MetricBar({ label, value, percent = false }) {
  const valid = Number.isFinite(value)
  const display = !valid
    ? '—'
    : percent
      ? `${(value * 100).toFixed(1)}%`
      : value.toFixed(3)

  const width = valid
    ? `${Math.max(0, Math.min(100, value * 100))}%`
    : '0%'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-200">{display}</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-400 transition-all"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, accent = 'teal' }) {
  const accents = {
    teal: 'bg-teal-400/10 text-teal-300',
    violet: 'bg-violet-400/10 text-violet-300',
    blue: 'bg-blue-400/10 text-blue-300',
    amber: 'bg-amber-400/10 text-amber-300',
  }

  return (
    <Card className="p-5 transition hover:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`rounded-xl p-2.5 ${accents[accent]}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-5 break-words text-xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>
    </Card>
  )
}

function App() {
  const [page, setPage] = useState('Overview')
  const [form, setForm] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [apiStatus, setApiStatus] = useState('checking')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [searchText, setSearchText] = useState('')

  const loadBackend = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/health`)

      if (!response.ok) {
        throw new Error('Backend health check failed')
      }

      const health = await response.json()

      if (!health.model_loaded) {
        setApiStatus('unavailable')
        setMetrics(null)
        return
      }

      setApiStatus('online')

      try {
        const metricResponse = await fetch(`${API}/api/metrics`)

        if (metricResponse.ok) {
          setMetrics(await metricResponse.json())
        } else {
          setMetrics(null)
        }
      } catch {
        setMetrics(null)
      }
    } catch {
      setApiStatus('offline')
      setMetrics(null)
    }
  }, [])

  useEffect(() => {
    loadBackend()
  }, [loadBackend])

  async function handlePredict(event) {
    event.preventDefault()
    setError('')
    setResult(null)

    if (apiStatus !== 'online') {
      setError('The backend model is unavailable. Start the API and try again.')
      return
    }

    const numericFields = [
      'Age',
      'RestingBP',
      'Cholesterol',
      'MaxHR',
      'Oldpeak',
    ]

    for (const key of numericFields) {
      if (form[key].trim() === '' || !Number.isFinite(Number(form[key]))) {
        setError(`Please enter a valid value for ${key}.`)
        return
      }
    }

    const payload = {
      ...form,
      Age: Number(form.Age),
      RestingBP: Number(form.RestingBP),
      Cholesterol: Number(form.Cholesterol),
      MaxHR: Number(form.MaxHR),
      Oldpeak: Number(form.Oldpeak),
      FastingBS: Number(form.FastingBS),
    }

    setLoading(true)

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'The prediction request was rejected.',
        )
      }

      setResult(data)
    } catch (err) {
      setError(
        `${err.message || 'Prediction failed'}. Check the backend terminal.`,
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM)
    setResult(null)
    setError('')
  }

  const navigation = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Prediction', icon: HeartPulse },
    { name: 'Model Insights', icon: BrainCircuit },
  ]

  const selectedModel = metrics?.selected_model || 'Not available'
  const testMetrics = metrics?.test_metrics || {}
  const accuracy = testMetrics.accuracy
  const rocAuc = testMetrics.roc_auc
  const datasetRows = metrics?.dataset_rows_after_duplicate_removal
  const matrix = metrics?.confusion_matrix

  const filteredNavigation = navigation.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100">
      {mobileMenu && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0b1625] transition-transform duration-200 lg:translate-x-0 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
            <HeartPulse size={25} />
          </div>

          <div>
            <h1 className="font-bold tracking-tight">TriRah</h1>
            <p className="mt-0.5 text-xs text-teal-300">CardioSense AI</p>
          </div>

          <button
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
            className="ml-auto text-slate-400 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">
            Workspace
          </p>

          {navigation.map((item) => {
            const Icon = item.icon
            const active = page === item.name

            return (
              <button
                key={item.name}
                onClick={() => {
                  setPage(item.name)
                  setMobileMenu(false)
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active
                    ? 'bg-teal-400/10 font-medium text-teal-300'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}

                {active && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-teal-900/60 bg-teal-400/5 p-4">
            <ShieldCheck size={22} className="mb-3 text-teal-300" />
            <p className="text-sm font-medium">Responsible AI</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Educational screening support. Not a substitute for medical
              assessment.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-800 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold">
              TR
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium">TriRah Project</p>
              <p className="text-xs text-slate-500">Machine learning lab</p>
            </div>

            <Heart size={16} className="ml-auto text-slate-500" />
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-800 bg-[#07111e]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
              className="text-slate-300 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Workspace / {page}
              </p>
              <h2 className="mt-1 truncate text-sm font-semibold sm:text-base">
                {page}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <label className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-[#101c2b] px-3 py-2 md:flex">
              <Search size={15} className="text-slate-500" />
              <input
                aria-label="Filter navigation"
                placeholder="Find a section..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-28 bg-transparent text-xs outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  apiStatus === 'online'
                    ? 'bg-emerald-400'
                    : apiStatus === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-400">
                {apiStatus === 'online'
                  ? 'API connected'
                  : apiStatus === 'checking'
                    ? 'Connecting...'
                    : apiStatus === 'unavailable'
                      ? 'Model unavailable'
                      : 'API offline'}
              </span>
            </div>

            <button
              aria-label="Refresh backend status"
              title="Refresh backend status"
              onClick={loadBackend}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-7 p-4 sm:p-8">
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-900/70 bg-teal-400/5 px-3 py-1.5 text-xs text-teal-300">
                <Sparkles size={14} />
                Machine learning workspace
              </div>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {page === 'Overview'
                  ? 'Cardiovascular intelligence'
                  : page}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {page === 'Overview'
                  ? 'Explore your trained model, evaluation results, and screening workflow.'
                  : page === 'Prediction'
                    ? 'Enter health features to request an estimate from your trained classifier.'
                    : 'Review the model selection process and held-out evaluation metrics.'}
              </p>
            </div>

            <button
              onClick={() => setPage('Prediction')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-[#06201f] transition hover:bg-teal-300"
            >
              <HeartPulse size={17} />
              New prediction
              <ArrowUpRight size={16} />
            </button>
          </section>

          {apiStatus !== 'online' && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-900/70 bg-amber-400/5 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-300" />
                <div>
                  <p className="text-sm font-medium text-amber-200">
                    {apiStatus === 'checking'
                      ? 'Checking backend connection'
                      : apiStatus === 'unavailable'
                        ? 'Model is not loaded'
                        : 'Backend connection unavailable'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Start the FastAPI server and ensure the trained model
                    exists in backend/models.
                  </p>
                </div>
              </div>

              <button
                onClick={loadBackend}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Retry connection
              </button>
            </div>
          )}

          {page === 'Overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Selected model"
                  value={selectedModel}
                  subtitle="Selected using training cross-validation"
                  icon={BrainCircuit}
                  accent="violet"
                />
                <StatCard
                  title="Test accuracy"
                  value={
                    accuracy == null
                      ? '—'
                      : `${(accuracy * 100).toFixed(1)}%`
                  }
                  subtitle="Held-out test set"
                  icon={Activity}
                />
                <StatCard
                  title="Test ROC-AUC"
                  value={rocAuc == null ? '—' : rocAuc.toFixed(3)}
                  subtitle="Classification discrimination metric"
                  icon={ShieldCheck}
                  accent="blue"
                />
                <StatCard
                  title="Dataset records"
                  value={datasetRows ?? '—'}
                  subtitle="After duplicate removal"
                  icon={Users}
                  accent="amber"
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <Card className="p-5 sm:p-6 xl:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        Illustrative activity trend
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Sample interface data, not real patient activity
                      </p>
                    </div>
                    <span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">
                      Sample week
                    </span>
                  </div>

                  <div className="mt-6 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={SAMPLE_ACTIVITY}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="tealFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#2dd4bf"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="100%"
                              stopColor="#2dd4bf"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="#243247"
                          strokeDasharray="4 4"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="day"
                          tick={{ fill: '#8290a5', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{ fill: '#8290a5', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            background: '#101c2b',
                            border: '1px solid #334155',
                            borderRadius: 12,
                            color: '#e2e8f0',
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="requests"
                          name="Sample requests"
                          stroke="#2dd4bf"
                          strokeWidth={2.5}
                          fill="url(#tealFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">
                      <BrainCircuit size={23} />
                    </div>
                    <div>
                      <h3 className="font-semibold">Model status</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Backend model registry
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-5">
                    <div>
                      <p className="text-xs text-slate-500">Classifier</p>
                      <p className="mt-1 break-words text-sm font-medium">
                        {selectedModel}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Training CV ROC-AUC
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {metrics?.cross_validation_roc_auc_mean == null
                          ? '—'
                          : metrics.cross_validation_roc_auc_mean.toFixed(3)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Training records
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {metrics?.training_rows ?? '—'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPage('Model Insights')}
                    className="mt-7 flex w-full items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    View model insights
                    <ChevronRight size={16} />
                  </button>
                </Card>
              </div>
            </>
          )}

          {(page === 'Prediction' || page === 'Overview') && (
            <div className="grid items-start gap-5 xl:grid-cols-3">
              <Card className="p-5 sm:p-7 xl:col-span-2">
                <div className="mb-6 flex items-start gap-3">
                  <div className="rounded-xl bg-teal-400/10 p-3 text-teal-300">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Patient feature input</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Enter values using the dataset's feature definitions
                      and units.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePredict}>
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {FIELDS.map((field) => (
                      <Field
                        key={field.name}
                        field={field}
                        value={form[field.name]}
                        onChange={(value) => {
                          setForm((current) => ({
                            ...current,
                            [field.name]: value,
                          }))
                          setResult(null)
                          setError('')
                        }}
                      />
                    ))}
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-5 flex items-start gap-2 rounded-xl border border-rose-900 bg-rose-400/5 p-3 text-sm text-rose-300"
                    >
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={loading || apiStatus !== 'online'}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-[#06201f] transition hover:bg-teal-300 disabled:opacity-50"
                    >
                      {loading ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Activity size={17} />
                      )}
                      {loading ? 'Analyzing...' : 'Run model prediction'}
                      {!loading && <ArrowRight size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      <RotateCcw size={15} />
                      Reset form
                    </button>
                  </div>
                </form>
              </Card>

              <div className="space-y-5">
                <Card className="overflow-hidden">
                  <div className="border-b border-slate-800 p-5">
                    <h3 className="font-semibold">Prediction result</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Output from the trained classifier
                    </p>
                  </div>

                  <div className="p-5">
                    {!result ? (
                      <div className="py-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 text-slate-500">
                          <HeartPulse size={29} />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">
                          No prediction yet
                        </p>
                        <p className="mx-auto mt-2 max-w-[220px] text-xs leading-5 text-slate-500">
                          Complete the form and run the model to display its
                          output here.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div
                          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                            result.prediction === 1
                              ? 'border-amber-800 bg-amber-400/5 text-amber-300'
                              : 'border-teal-900 bg-teal-400/5 text-teal-300'
                          }`}
                        >
                          {result.prediction === 1 ? (
                            <AlertCircle size={20} className="shrink-0" />
                          ) : (
                            <CheckCircle2 size={20} className="shrink-0" />
                          )}

                          <span className="font-medium">{result.result}</span>
                        </div>

                        <p className="mt-6 text-xs text-slate-500">
                          Model score for class 1
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {result.model_score_percent}%
                        </p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-teal-400 transition-all"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, result.model_score_percent),
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-4 text-xs leading-5 text-slate-400">
                          {result.disclaimer}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck size={18} className="text-teal-300" />
                    Clinical safety note
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-400">
                    This experimental model is for educational purposes only.
                    It cannot rule out heart disease or replace professional
                    medical evaluation. Seek urgent care for severe or
                    persistent chest pain, difficulty breathing, or other
                    emergency symptoms.
                  </p>
                </Card>
              </div>
            </div>
          )}

          {page === 'Model Insights' && (
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold">Selected classifier</h3>
                <p className="mt-3 break-words text-2xl font-semibold">
                  {selectedModel}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The classifier is selected using mean five-fold
                  cross-validation ROC-AUC on the training data.
                </p>

                <div className="mt-7 space-y-5">
                  <MetricBar
                    label="Cross-validation ROC-AUC"
                    value={metrics?.cross_validation_roc_auc_mean}
                  />
                  <MetricBar
                    label="Test accuracy"
                    value={testMetrics.accuracy}
                    percent
                  />
                  <MetricBar
                    label="Test precision"
                    value={testMetrics.precision}
                    percent
                  />
                  <MetricBar
                    label="Test recall"
                    value={testMetrics.recall}
                    percent
                  />
                  <MetricBar
                    label="Test F1 score"
                    value={testMetrics.f1}
                  />
                  <MetricBar
                    label="Test ROC-AUC"
                    value={testMetrics.roc_auc}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold">Evaluation details</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Held-out test set confusion matrix
                </p>

                {Array.isArray(matrix) && matrix.length === 2 ? (
                  <div className="mt-5 grid max-w-sm grid-cols-2 gap-3">
                    {[
                      {
                        value: matrix[0]?.[0],
                        label: 'True negative',
                      },
                      {
                        value: matrix[0]?.[1],
                        label: 'False positive',
                      },
                      {
                        value: matrix[1]?.[0],
                        label: 'False negative',
                      },
                      {
                        value: matrix[1]?.[1],
                        label: 'True positive',
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-xl border border-slate-700 bg-[#0a1523] p-5"
                      >
                        <p className="text-2xl font-semibold">
                          {cell.value ?? '—'}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {cell.label}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    Metrics unavailable. Train the model first.
                  </p>
                )}

                <div className="mt-6 rounded-xl border border-slate-800 bg-[#0a1523] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ClipboardList size={17} className="text-teal-300" />
                    Dataset and split
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Total records</span>
                      <span>{datasetRows ?? '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Training records</span>
                      <span>{metrics?.training_rows ?? '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Test records</span>
                      <span>{metrics?.test_rows ?? '—'}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-slate-500">
                  Evaluation scores describe this dataset and split only.
                  They do not establish clinical usefulness or performance
                  on other populations.
                </p>
              </Card>
            </div>
          )}

          <footer className="flex flex-col gap-2 border-t border-slate-800 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} TriRah CardioSense AI · Educational
              project
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck size={14} />
              Responsible machine learning · Not a diagnosis
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
