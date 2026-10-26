import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const schoolLogo = `${import.meta.env.BASE_URL}school-logo.png`;

type Language = 'en' | 'dv';
type View = 'form' | 'admin';
type Status = 'new' | 'contacted' | 'approved';
type AdminTab = 'applications' | 'content' | 'sports' | 'settings';

type Sport = { id: string; name: string; charge: number; display_order: number };

type Application = {
  id: string;
  created_at: string;
  full_name: string;
  date_of_birth: string;
  permanent_address: string;
  present_address: string;
  id_card_no: string;
  age: number;
  island: string;
  contact_number: string;
  preferred_sports: string[];
  status: Status;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  passport_photo_url: string | null;
  payment_slip_url: string | null;
};

type FormData = Omit<Application, 'id' | 'created_at' | 'status'>;

type ContentRow = { key: string; en: string; dv: string };

const sports = ['Volleyball', 'Football', 'Handball', 'Swimming'];
const initialForm: FormData = {
  full_name: '',
  date_of_birth: '',
  permanent_address: '',
  present_address: '',
  id_card_no: '',
  age: 0,
  island: '',
  contact_number: '',
  preferred_sports: [],
  id_card_front_url: '',
  id_card_back_url: '',
  passport_photo_url: '',
  payment_slip_url: '',
};

const fallbackCopy: Record<string, { en: string; dv: string }> = {
  navForm: { en: 'Membership form', dv: 'މެމްބަރޝިޕް ފޯމް' },
  navAdmin: { en: 'Admin portal', dv: 'އެޑްމިން ޕޯޓަލް' },
  eyebrow: { en: 'FEEALI YOUTH ACADEMY', dv: 'ފީއަލީ ޔޫތު އެކެޑަމީ' },
  title: { en: 'Make your next move count.', dv: 'ތިޔަ ކުރާ ފަހު ކަން މުހިންމު.' },
  subtitle: { en: 'Join a community built to help young people learn, grow, and lead through sport.', dv: 'ކުޅިވަރުން ޒުވާނުން ދަސްކޮށް، ތަރައްޤީކޮށް، ރައްޔިތުންނަށް ގެންދެވޭ ކޮމިއުނިޓީއަކަށް ވަދެލާ.' },
  start: { en: 'Start application', dv: 'އެޕްލިކޭޝަން ފެށޭ' },
  note: { en: 'Takes about 3 minutes · No payment required today', dv: 'ގާތްގަނޑަކަށް 3 މިނިޓް · މިހާރު ފައިސާ ނުދޭ' },
  details: { en: 'Personal details', dv: 'މީހާގެ ތަފްސީލުތައް' },
  detailsHint: { en: 'Tell us a little about yourself.', dv: 'ތިޔަބަހެއް ކުޑަކޮށް ބުނެލަން.' },
  fullName: { en: 'Full name', dv: 'ނަންފުޅު' },
  dob: { en: 'Date of birth', dv: 'އުފަން ތާރީޚް' },
  age: { en: 'Age', dv: 'އުމުރު' },
  id: { en: 'ID card number', dv: 'އައިޑީ ކާޑު ނަންބަރު' },
  permanent: { en: 'Permanent address', dv: 'ދާއިމީ އެޑްރެސް' },
  present: { en: 'Present address', dv: 'މިހާރު އެޑްރެސް' },
  island: { en: 'Island', dv: 'ރަށް' },
  contact: { en: 'Contact number', dv: 'ކޮންޓެކްޓް ނަންބަރު' },
  sports: { en: 'Preferred sports', dv: 'ކުޅެވޭ ކުޅިވަރުތައް' },
  sportsHint: { en: 'Choose all that interest you', dv: 'އެދޭ ކުޅިވަރުތައް ހޮވާލާ' },
  continue: { en: 'Review application', dv: 'ފޯމް ބަލާލާ' },
  fee: { en: 'MVR 200 WILL BE TAKEN UPON THE REGISTRATION AS REGISTRATION FEE.', dv: 'ރަޖިސްޓްރޭޝަން ފީ ލުގެ 200 ރުފިޔާ ރަޖިސްޓްރޭޝަން ފީއެއްގެ ގޮތުގައި ދިމާވާނެ.' },
  submit: { en: 'Submit application', dv: 'އެޕްލިކޭޝަން ފޮނުވާ' },
  back: { en: 'Back to edit', dv: 'އިސްލާހަށް ދާން' },
  review: { en: 'Review your details', dv: 'ތިޔަ ބެލި ތަފްސީލު' },
  reviewHint: { en: 'Please make sure everything looks right before sending.', dv: 'ފޮނުވުމުގެ ކުރިން ހުރިހާ ކަމެއް ރަނގަޅަށް ބަލާލާ.' },
  successTitle: { en: 'Application received', dv: 'އެޕްލިކޭޝަން ލިބިއްޖެ' },
  successText: { en: 'Thank you for applying to Feeali Youth Academy. Our team will review your application and contact you soon.', dv: 'ފީއަލީ ޔޫތު އެކެޑަމީއަށް އެދިފިން. ތިޔަގެ ފޯމް ބަލައިގެން ވަގުތުން ގުޅާނެ.' },
  footerCredit: { en: '© 2026 Feeali Youth Academy', dv: '© 2026 ފީއަލީ ޔޫތު އެކެޑަމީ' },
  newApplication: { en: 'Submit another application', dv: 'އަލުން ފޯމެއް ފޮނުވާ' },
  secure: { en: 'Your information is kept private and is only used for membership processing.', dv: 'ތިޔަގެ މައުލޫމާތު މަސްތައްވެރިކޮށް ބެލޭނެ.' },
  adminTitle: { en: 'Welcome back', dv: 'މަރުޙަބާ' },
  adminText: { en: 'Sign in to manage membership applications.', dv: 'މެމްބަރޝިޕް އެޕްލިކޭޝަންތައް ބެލުމަށް ލޮގްއިންވޭ.' },
  email: { en: 'Admin email', dv: 'އެޑްމިން އީމެއިލް' },
  password: { en: 'Password', dv: 'ޕާސްވޯޑް' },
  signIn: { en: 'Sign in', dv: 'ލޮގްއިން' },
  create: { en: 'First-time setup', dv: 'ފުރަތަމަ ސެޓަޕް' },
  createHint: { en: 'Create the first admin account for this academy.', dv: 'މި އެކެޑަމީގެ ފުރަތަމަ އެޑްމިން އެކައުންޓެއް ހަދާ.' },
  createAccount: { en: 'Create admin account', dv: 'އެޑްމިން އެކައުންޓް ހަދާ' },
  switchPublic: { en: 'Back to public form', dv: 'ފޯމަށް އެނބުރޭ' },
  dashboard: { en: 'Applications', dv: 'އެޕްލިކޭޝަންތައް' },
  total: { en: 'Total applications', dv: 'ޖުމްލަ އެޕްލިކޭޝަން' },
  pending: { en: 'Needs attention', dv: 'ބެލުމަށް ބާކީ' },
  approved: { en: 'Approved', dv: 'އެޕްރޫވްކުރެވިފައި' },
  search: { en: 'Search by name, ID or island', dv: 'ނަން، ID ނުވަތަ ރަށުން ހޯދާ' },
  all: { en: 'All statuses', dv: 'ހުރިހާ ސްޓޭޓަސް' },
  noResults: { en: 'No applications match your search.', dv: 'ތިޔަ ހޯދާފައިވާ އެޕްލިކޭޝަން ނެތް.' },
  signOut: { en: 'Sign out', dv: 'ލޮގްއައުޓް' },
  status: { en: 'Status', dv: 'ސްޓޭޓަސް' },
  submitted: { en: 'Submitted', dv: 'ފޮނުވި ތާރީޚް' },
  updateError: { en: 'Could not save that change. Please try again.', dv: 'މި ބަދަލު ސޭވްކުރެވިއްޖެއް ނޫން.' },
  submitError: { en: 'Could not submit your application. Please try again.', dv: 'ތިޔަގެ ފޯމް ފޮނުވެއްޖެއް ނޫން.' },
  authError: { en: 'We could not sign you in. Please check your details.', dv: 'ލޮގްއިންވެއްޖެއް ނޫން. ތަފްސީލު ބަލާލާ.' },
  deleteConfirm: { en: 'Delete this application permanently?', dv: 'މި އެޕްލިކޭޝަން ދާއިމީކޮށް ޑިލީޓްކުރަންތަ؟' },
  emptySports: { en: 'Select at least one sport.', dv: 'ކުޅިވަރެއް ހޮވާލާ.' },
  contentTab: { en: 'Content', dv: 'ލިޔުންތައް' },
  contentManager: { en: 'Text content', dv: 'ލިޔުންތައް' },
  contentManagerHint: { en: 'Edit or delete any text shown on the form in both languages.', dv: 'ފޯމުގައި ފެނޭ ހުރިހާ ލިޔުމެއް އެއް ބަހުން އިސްލާހުން ނުވަތަ ޑިލީޓްކުރޭ.' },
  contentKey: { en: 'Key', dv: 'ކީ' },
  englishText: { en: 'English', dv: 'އިނގިރިސި' },
  dhivehiText: { en: 'Dhivehi', dv: 'ދިވެހި' },
  saveContent: { en: 'Save', dv: 'ސޭވް' },
  addContent: { en: 'Add new', dv: 'އިތުރުކުރޭ' },
  searchContent: { en: 'Search texts', dv: 'ލިޔުންތައް ހޯދާ' },
  deleteContentConfirm: { en: 'Delete this text permanently?', dv: 'މި ލިޔުން ދާއިމީކޮށް ޑިލީޓްކުރަންތަ؟' },
  newKeyPlaceholder: { en: 'new_key', dv: 'އައު_ކީ' },
  contentError: { en: 'Could not save. Please try again.', dv: 'ސޭވްކުރެވިއްޖެއް ނޫން. އަލުން މަސައްކަތްކުރޭ.' },
  photoUpload: { en: 'Photo uploads', dv: 'ފޮޓޯ އަޕްލޯޑް' },
  photoHint: { en: 'Upload clear photos of your ID card (both sides) and a passport-size photo.', dv: 'އައިޑީ ކާޑު (ދެފަރާ) އަދި ޕާސްޕޯޓް ފޮޓޯ ސާފައި އަޕްލޯޑް ކުރޭ.' },
  idFront: { en: 'ID card (front)', dv: 'އައިޑީ ކާޑު (ކުރިފަސް)' },
  idBack: { en: 'ID card (back)', dv: 'އައިޑީ ކާޑު (ފަހަރާ)' },
  passportPhoto: { en: 'Passport-size photo', dv: 'ޕާސްޕޯޓް ފޮޓޯ' },
  uploadHint: { en: 'Click or tap to upload', dv: 'އަޕްލޯޑް ކުރަން ފިއްތޭ' },
  uploadError: { en: 'Could not upload that photo. Please try again.', dv: 'ފޮޓޯ އަޕްލޯޑް ކުރެވިއްޖެއް ނޫން.' },
  photosRequired: { en: 'Please upload all three photos.', dv: 'ނިތިން ފޮޓޯ އަޕްލޯޑް ކުރޭ.' },
  paymentSection: { en: 'Registration fee payment', dv: 'ރަޖިސްޓްރޭޝަން ފީ ބައިލާ' },
  paymentHint: { en: 'Transfer MVR 200 for Registration fee to the account below, then upload the transfer slip.', dv: 'ރަޖިސްޓްރޭޝަން ފީ ލުގެ 200 ރުފިޔާ ހުރި އެކައުންޓަށް ބަދަލުކޮށް ސްލިޕް އަޕްލޯޑް ކުރޭ.' },
  accountName: { en: 'Account name', dv: 'އެކައުންޓް ނަން' },
  accountNumber: { en: 'Account number', dv: 'އެކައުންޓް ނަމްބަރު' },
  viberNumber: { en: 'Viber', dv: 'ވައިބަރ' },
  paymentSlip: { en: 'Payment transfer slip', dv: 'ބައިލާ ސްލިޕް' },
  slipRequired: { en: 'Please upload your payment slip.', dv: 'ބައިލާ ސްލިޕް އަޕްލޯޑް ކުރޭ.' },
  viewPhotos: { en: 'View photos', dv: 'ފޮޓޯ ބަލާ' },
  sportsTab: { en: 'Sports', dv: 'ކުޅިވަރު' },
  sportsManager: { en: 'Sports & charges', dv: 'ކުޅިވަރު އަދި ފީ' },
  sportsManagerHint: { en: 'Add, edit, or remove sports and their registration charges.', dv: 'ކުޅިވަރު އިތުރުކުރުން، އިސްލާހުން ނުވަތަ ޑިލީޓް ކުރުން.' },
  sportName: { en: 'Sport name', dv: 'ކުޅިވަރު ނަން' },
  sportCharge: { en: 'Charge (MVR)', dv: 'ފީ (ރުފިޔާ)' },
  addSport: { en: 'Add sport', dv: 'ކުޅިވަރު އިތުރުކުރޭ' },
  deleteSportConfirm: { en: 'Delete this sport permanently?', dv: 'މި ކުޅިވަރު ދާއިމީކޮށް ޑިލީޓް ކުރަންތަ؟' },
  paymentSlipLabel: { en: 'Payment slip', dv: 'ބައިލާ ސްލިޕް' },
  closeBtn: { en: 'Close', dv: 'ބަންސް' },
  settingsTab: { en: 'Settings', dv: 'ސެޓިންގްސް' },
  settingsManager: { en: 'Site settings', dv: 'ސައިޓް ސެޓިންގްސް' },
  settingsManagerHint: { en: 'Control which features appear on the public form.', dv: 'ފޯމުގައި ފެނޭ ފީޗަރތައް ކޮންޓްރޯލް ކުރޭ.' },
  dhivehiToggle: { en: 'Show Dhivehi language', dv: 'ދިވެހި ބަސް ދައްކާ' },
  dhivehiToggleHint: { en: 'When off, the language switcher is hidden and the form stays in English only.', dv: 'އޮފް ކުރުމުން ބަހު ބަދަލުކުރާ ބަޓަން ފޮރުވާނެ.' },
  settingsSaved: { en: 'Saved', dv: 'ސޭވްކުރެވިއްޖެ' },
  settingsError: { en: 'Could not save that setting. Please try again.', dv: 'ސެޓިންގްސް ސޭވްކުރެވިއްޖެއް ނޫން.' },
};

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<View>('form');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [authSession, setAuthSession] = useState<boolean>(false);
  const [content, setContent] = useState<Record<string, ContentRow>>({});
  const [dhivehiEnabled, setDhivehiEnabled] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);

  const t = useMemo(() => {
    const result: Record<string, string> = {};
    Object.keys(fallbackCopy).forEach((key) => {
      const row = content[key];
      result[key] = (row ? row[language] : fallbackCopy[key][language]) || fallbackCopy[key][language];
    });
    return result;
  }, [content, language]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthSession(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(Boolean(session));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('site_content').select('*').then(({ data, error }) => {
      if (error) { console.error('content load failed', error); return; }
      const map: Record<string, ContentRow> = {};
      (data as ContentRow[] | null)?.forEach((row) => { map[row.key] = row; });
      setContent(map);
    });
    supabase.from('site_settings').select('*').then(({ data, error }) => {
      if (error) { console.error('settings load failed', error); return; }
      (data as { key: string; value: string }[] | null)?.forEach((row) => {
        if (row.key === 'dhivehi_enabled') setDhivehiEnabled(row.value === 'true');
      });
    });
    supabase.from('sports').select('*').order('display_order', { ascending: true }).then(({ data, error }) => {
      if (error) { console.error('sports load failed', error); return; }
      setSports((data as Sport[]) ?? []);
    });
  }, []);

  const reloadContent = async () => {
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) { console.error('content reload failed', error); return; }
    const map: Record<string, ContentRow> = {};
    (data as ContentRow[] | null)?.forEach((row) => { map[row.key] = row; });
    setContent(map);
  };

  const updateField = (field: keyof FormData, value: string | number | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.full_name || !form.date_of_birth || !form.id_card_no || !form.age || !form.permanent_address || !form.present_address || !form.island || !form.contact_number) {
      setFormError(language === 'en' ? 'Please complete all fields before continuing.' : 'ކޮންމެ ފީލްޑެއް ފުރަންވާނެ.');
      return false;
    }
    if (!form.preferred_sports.length) {
      setFormError(t.emptySports);
      return false;
    }
    if (!form.id_card_front_url || !form.id_card_back_url || !form.passport_photo_url) {
      setFormError(t.photosRequired);
      return false;
    }
    if (!form.payment_slip_url) {
      setFormError(t.slipRequired);
      return false;
    }
    setFormError('');
    return true;
  };

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setFormError('');
    const { error } = await supabase.from('membership_applications').insert(form);
    if (error) {
      console.error('membership submission failed', error);
      setFormError(t.submitError);
      return;
    }
    setStep('success');
  };

  const uploadPhoto = async (field: 'id_card_front_url' | 'id_card_back_url' | 'passport_photo_url' | 'payment_slip_url', file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setFormError(t.uploadError);
      return;
    }
    setUploading(true);
    setFormError('');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error: upError } = await supabase.storage.from('application-photos').upload(fileName, file, { contentType: file.type, upsert: false });
    if (upError) {
      console.error('photo upload failed', upError);
      setFormError(t.uploadError);
      setUploading(false);
      return;
    }
    updateField(field, fileName);
    setPhotoPreviews((current) => ({ ...current, [field]: URL.createObjectURL(file) }));
    setUploading(false);
  };

  const resetForm = () => {
    Object.values(photoPreviews).forEach((preview) => URL.revokeObjectURL(preview));
    setPhotoPreviews({});
    setForm(initialForm);
    setStep('form');
    setFormError('');
  };

  return (
    <div className={language === 'dv' ? 'app dv' : 'app'} dir={language === 'dv' ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => { setView('form'); resetForm(); }} aria-label="Feeali Youth Academy home">
            <img src={schoolLogo} alt="Feeali Youth Academy logo" />
            <span><b>FEEALI</b><small>YOUTH ACADEMY</small></span>
          </button>
          <nav className={isMenuOpen ? 'nav open' : 'nav'}>
            <button className={view === 'form' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('form'); setIsMenuOpen(false); }}>{t.navForm}</button>
            <button className={view === 'admin' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('admin'); setIsMenuOpen(false); }}>{t.navAdmin}</button>
          </nav>
          <div className="header-actions">
            {dhivehiEnabled && <button className="language-switch" onClick={() => setLanguage(language === 'en' ? 'dv' : 'en')}><Languages size={17} /> {language === 'en' ? 'ދިވެހި' : 'English'}</button>}
            <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open menu">{isMenuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>

      {view === 'admin' ? <AdminPortal language={language} t={t} authenticated={authSession} dhivehiEnabled={dhivehiEnabled} onDhivehiChange={setDhivehiEnabled} onContentReload={reloadContent} onBack={() => setView('form')} /> : (
        <main>
          {step === 'success' ? <SuccessView t={t} onReset={resetForm} /> : <>
            <section className="hero">
              <div className="hero-grid">
                <div className="hero-content">
                  <div className="eyebrow"><span className="eyebrow-dot" /> {t.eyebrow}</div>
                  <h1>{t.title}</h1>
                  <p>{t.subtitle}</p>
                  <button className="primary-button hero-button" onClick={() => document.getElementById('membership-form')?.scrollIntoView({ behavior: 'smooth' })}>{t.start} <ArrowRight size={18} /></button>
                  <div className="hero-note"><Clock3 size={15} /> {t.note}</div>
                </div>
                <div className="hero-art">
                  <div className="art-ring ring-one" /><div className="art-ring ring-two" />
                  <img src={schoolLogo} alt="Feeali Youth Academy" />
                  <div className="floating-card card-one"><Sparkles size={17} /><span>Learn<br /><b>Grow</b></span></div>
                  <div className="floating-card card-two"><ShieldCheck size={17} /><span>Built for<br /><b>your future</b></span></div>
                </div>
              </div>
            </section>
            <section className="form-section" id="membership-form">
              <div className="section-heading"><div className="section-kicker">01 / {t.navForm}</div><h2>{step === 'review' ? t.review : t.details}</h2><p>{step === 'review' ? t.reviewHint : t.detailsHint}</p></div>
              {step === 'form' ? <form className="application-form" onSubmit={(event) => { event.preventDefault(); if (validateForm()) setStep('review'); }}>
                <div className="form-grid">
                  <Field label={t.fullName} value={form.full_name} onChange={(value) => updateField('full_name', value)} placeholder="e.g. Ahmed Ali" />
                  <Field label={t.dob} type="date" value={form.date_of_birth} onChange={(value) => updateField('date_of_birth', value)} />
                  <Field label={t.age} type="number" value={form.age || ''} onChange={(value) => updateField('age', Number(value))} placeholder="18" />
                  <Field label={t.id} value={form.id_card_no} onChange={(value) => updateField('id_card_no', value)} placeholder="A123456" />
                  <Field label={t.permanent} value={form.permanent_address} onChange={(value) => updateField('permanent_address', value)} placeholder="House / street / island" wide />
                  <Field label={t.present} value={form.present_address} onChange={(value) => updateField('present_address', value)} placeholder="Current address" wide />
                  <Field label={t.island} value={form.island} onChange={(value) => updateField('island', value)} placeholder="Feeali" />
                  <Field label={t.contact} type="tel" value={form.contact_number} onChange={(value) => updateField('contact_number', value)} placeholder="7XX XXXX" wide />
                </div>
                <div className="sports-block"><div className="field-label">{t.sports}<span>{t.sportsHint}</span></div><div className="sport-options">{sports.map((sport, index) => <button type="button" className={form.preferred_sports.includes(sport.name) ? 'sport-option selected' : 'sport-option'} key={sport.id} onClick={() => updateField('preferred_sports', form.preferred_sports.includes(sport.name) ? form.preferred_sports.filter((item) => item !== sport.name) : [...form.preferred_sports, sport.name])}><span className="sport-number">0{index + 1}</span><span>{sport.name} — {sport.charge}/- MVR</span>{form.preferred_sports.includes(sport.name) && <Check size={17} />}</button>)}</div></div>
                <div className="photo-block">
                  <div className="field-label">{t.photoUpload}<span>{t.photoHint}</span></div>
                  <div className="photo-grid">
                    <PhotoUpload label={t.idFront} orientation="landscape" value={photoPreviews.id_card_front_url} onUpload={(file) => uploadPhoto('id_card_front_url', file)} uploading={uploading} hint={t.uploadHint} />
                    <PhotoUpload label={t.idBack} orientation="landscape" value={photoPreviews.id_card_back_url} onUpload={(file) => uploadPhoto('id_card_back_url', file)} uploading={uploading} hint={t.uploadHint} />
                    <PhotoUpload label={t.passportPhoto} orientation="portrait" value={photoPreviews.passport_photo_url} onUpload={(file) => uploadPhoto('passport_photo_url', file)} uploading={uploading} hint={t.uploadHint} />
                  </div>
                </div>
                <div className="payment-block">
                  <div className="field-label">{t.paymentSection}<span>{t.paymentHint}</span></div>
                  <div className="account-details">
                    <div className="account-row"><span>{t.accountName}</span><strong>Ali Zahir</strong></div>
                    <div className="account-row"><span>{t.accountNumber}</span><strong>770 940 366 4101</strong></div>
                    <div className="account-row"><span>{t.viberNumber}</span><strong>7860408</strong></div>
                  </div>
                  <div className="photo-grid single">
                    <PhotoUpload label={t.paymentSlip} orientation="landscape" value={photoPreviews.payment_slip_url} onUpload={(file) => uploadPhoto('payment_slip_url', file)} uploading={uploading} hint={t.uploadHint} />
                  </div>
                </div>
                {formError && <div className="form-error">{formError}</div>}
                <div className="form-footer"><span className="fee-note bold"><FileText size={17} /> {t.fee}</span><button className="primary-button" type="submit">{t.continue} <ArrowRight size={18} /></button></div>
              </form> : <ReviewCard form={form} photoPreviews={photoPreviews} t={t} onBack={() => setStep('form')} onSubmit={submitApplication} error={formError} />}
            </section>
          </>}
        </main>
      )}
      <footer><div className="footer-inner"><span>{t.footerCredit}</span><span>{t.secure}</span></div></footer>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', wide = false }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string; wide?: boolean }) {
  return <label className={wide ? 'field wide' : 'field'}><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required /></label>;
}

function PhotoUpload({ label, orientation, value, onUpload, uploading, hint }: { label: string; orientation: 'landscape' | 'portrait'; value?: string; onUpload: (file: File) => void; uploading: boolean; hint: string }) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
  };
  return <label className="photo-upload">
    <span className="photo-label">{label}</span>
    <div className={`${value ? 'photo-preview uploaded' : 'photo-preview'} ${orientation}`}>
      {value ? <img src={value} alt={label} /> : <div className="photo-placeholder"><Upload size={22} /><span>{uploading ? 'Uploading…' : hint}</span></div>}
      {value && <div className="photo-check"><Check size={14} /></div>}
    </div>
    <input type="file" accept="image/*" onChange={handleChange} disabled={uploading} className="photo-input" />
  </label>;
}

function ReviewCard({ form, photoPreviews, t, onBack, onSubmit, error }: { form: FormData; photoPreviews: Record<string, string>; t: Record<string, string>; onBack: () => void; onSubmit: (event: FormEvent) => void; error: string }) {
  const reviewItems: [string, string][] = [
    [t.fullName, form.full_name], [t.dob, form.date_of_birth], [t.age, String(form.age)], [t.id, form.id_card_no], [t.permanent, form.permanent_address], [t.present, form.present_address], [t.island, form.island], [t.contact, form.contact_number], [t.sports, form.preferred_sports.join(', ')],
  ];
  return <form className="review-card" onSubmit={onSubmit}><div className="review-list">{reviewItems.map(([label, value]) => <div className="review-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="review-photos">
      <div className="review-photo"><span>{t.idFront}</span><img src={photoPreviews.id_card_front_url} alt={t.idFront} /></div>
      <div className="review-photo"><span>{t.idBack}</span><img src={photoPreviews.id_card_back_url} alt={t.idBack} /></div>
      <div className="review-photo"><span>{t.passportPhoto}</span><img src={photoPreviews.passport_photo_url} alt={t.passportPhoto} /></div>
      <div className="review-photo"><span>{t.paymentSlip}</span><img src={photoPreviews.payment_slip_url} alt={t.paymentSlip} /></div>
    </div>
    {error && <div className="form-error">{error}</div>}<div className="form-footer"><button className="text-button" type="button" onClick={onBack}>← {t.back}</button><button className="primary-button" type="submit">{t.submit} <ArrowRight size={18} /></button></div></form>;
}

function SuccessView({ t, onReset }: { t: Record<string, string>; onReset: () => void }) {
  return <main className="success-page"><div className="success-mark"><Check size={36} /></div><div className="eyebrow">FEEALI YOUTH ACADEMY</div><h1>{t.successTitle}</h1><p>{t.successText}</p><button className="primary-button" onClick={onReset}>{t.newApplication} <ArrowRight size={18} /></button></main>;
}

function AdminPortal({ language, t, authenticated, dhivehiEnabled, onDhivehiChange, onContentReload, onBack }: { language: Language; t: Record<string, string>; authenticated: boolean; dhivehiEnabled: boolean; onDhivehiChange: (value: boolean) => void; onContentReload: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>('applications');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => { if (authenticated) loadApplications(); }, [authenticated]);
  useEffect(() => { if (authenticated) loadSports(); }, [authenticated]);

  const loadSports = async () => {
    const { data, error: fetchError } = await supabase.from('sports').select('*').order('display_order', { ascending: true });
    if (fetchError) { console.error('sports load failed', fetchError); return; }
    setSports((data as Sport[]) ?? []);
  };

  const loadApplications = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from('membership_applications').select('*').order('created_at', { ascending: false });
    if (fetchError) { console.error('application load failed', fetchError); setError(t.authError); } else setApplications((data as Application[]) ?? []);
    setLoading(false);
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { console.error('admin auth failed', result.error); setError(t.authError); setLoading(false); return; }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error: updateError } = await supabase.from('membership_applications').update({ status }).eq('id', id);
    if (updateError) { console.error('status update failed', updateError); setError(t.updateError); return; }
    setApplications((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  };

  const removeApplication = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const { error: deleteError } = await supabase.from('membership_applications').delete().eq('id', id);
    if (deleteError) { console.error('application delete failed', deleteError); setError(t.updateError); return; }
    setApplications((items) => items.filter((item) => item.id !== id));
  };

  const filtered = useMemo(() => applications.filter((item) => (filter === 'all' || item.status === filter) && [item.full_name, item.id_card_no, item.island, item.contact_number].join(' ').toLowerCase().includes(query.toLowerCase())), [applications, filter, query]);

  if (!authenticated) return <main className="auth-page"><div className="auth-card"><div className="auth-icon"><ShieldCheck size={24} /></div><div className="section-kicker">{t.navAdmin}</div><h1>{t.adminTitle}</h1><p>{t.adminText}</p><form onSubmit={submitAuth}><label className="field"><span>{t.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Enter admin email" autoComplete="username" /></label><label className="field"><span>{t.password}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="Enter password" autoComplete="current-password" /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button full-width" disabled={loading}>{t.signIn} <ArrowRight size={18} /></button></form><button className="back-link" onClick={onBack}>← {t.switchPublic}</button></div></main>;

  const newCount = applications.filter((item) => item.status === 'new').length;
  return <main className="dashboard">
    <div className="dashboard-top"><div><div className="section-kicker">{t.navAdmin}</div><h1>{tab === 'applications' ? t.dashboard : tab === 'content' ? t.contentManager : tab === 'sports' ? t.sportsManager : t.settingsManager}</h1><p>{tab === 'applications' ? 'Track, review, and manage every membership request.' : tab === 'content' ? t.contentManagerHint : tab === 'sports' ? t.sportsManagerHint : t.settingsManagerHint}</p></div><button className="outline-button" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> {t.signOut}</button></div>
    <div className="admin-tabs">
      <button className={tab === 'applications' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('applications')}><ClipboardList size={16} /> {t.dashboard}</button>
      <button className={tab === 'content' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('content')}><FileText size={16} /> {t.contentTab}</button>
      <button className={tab === 'sports' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('sports')}><Sparkles size={16} /> {t.sportsTab}</button>
      <button className={tab === 'settings' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('settings')}><Settings size={16} /> {t.settingsTab}</button>
    </div>
    {tab === 'applications' ? <>
      <div className="stats-grid"><Stat icon={<ClipboardList size={19} />} value={applications.length} label={t.total} tone="blue" /><Stat icon={<Clock3 size={19} />} value={newCount} label={t.pending} tone="orange" /><Stat icon={<Check size={19} />} value={applications.filter((item) => item.status === 'approved').length} label={t.approved} tone="green" /></div>
      <div className="table-panel"><div className="table-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></div><div className="filter-wrap"><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | Status)}><option value="all">{t.all}</option><option value="new">New</option><option value="contacted">Contacted</option><option value="approved">Approved</option></select><ChevronDown size={16} /></div></div>{error && <div className="form-error table-error">{error}</div>}{loading ? <div className="empty-state">Loading…</div> : filtered.length === 0 ? <div className="empty-state"><ClipboardList size={30} /><p>{t.noResults}</p></div> : <><div className="application-row application-header"><div className="applicant-header">{t.fullName}</div><div className="contact-header">{t.contact}</div><div className="sports-summary">{t.sports}</div><div className="date-summary">{t.submitted}</div><div className="status-header">{t.status}</div><div /></div><div className="applications-list">{filtered.map((application) => <div className="application-row" key={application.id}><div className="applicant"><div className="avatar">{application.full_name.charAt(0).toUpperCase()}</div><div><strong>{application.full_name}</strong><span>{application.id_card_no} · {application.island}</span></div></div><div className="contact-cell">{application.contact_number}</div><div className="sports-summary">{application.preferred_sports.join(' · ')}</div><div className="date-summary">{new Date(application.created_at).toLocaleDateString(language === 'dv' ? 'dv-MV' : 'en-MV')}</div>{application.status === 'approved' ? <div className="status-badge approved"><Check size={14} /> 200 MVR</div> : <select className={`status-select ${application.status}`} value={application.status} onChange={(event) => updateStatus(application.id, event.target.value as Status)}><option value="new">New</option><option value="contacted">Contacted</option><option value="approved">Approve</option></select>}<button className="view-photos-btn" onClick={() => setSelectedApp(application)} aria-label={t.viewPhotos}><ImageIcon size={16} /></button><button className="delete-button" onClick={() => removeApplication(application.id)} aria-label="Delete application"><Trash2 size={16} /></button></div>)}</div></>}</div>
    </> : tab === 'content' ? <ContentManager t={t} onContentChange={onContentReload} /> : tab === 'sports' ? <SportsManager t={t} sports={sports} onReload={loadSports} /> : <SettingsManager t={t} dhivehiEnabled={dhivehiEnabled} onDhivehiChange={onDhivehiChange} />}
    {selectedApp && <PhotoModal application={selectedApp} t={t} onClose={() => setSelectedApp(null)} />}
  </main>;
}

function ContentManager({ t, onContentChange }: { t: Record<string, string>; onContentChange: () => void }) {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [query, setQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editDv, setEditDv] = useState('');
  const [editKey, setEditKey] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.from('site_content').select('*').order('key', { ascending: true });
    if (loadError) { console.error('content load failed', loadError); setError(t.contentError); } else setRows((data as ContentRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (row: ContentRow) => {
    setEditingKey(row.key); setEditKey(row.key); setEditEn(row.en); setEditDv(row.dv); setIsNew(false); setError('');
  };

  const startNew = () => {
    setEditingKey(''); setEditKey(''); setEditEn(''); setEditDv(''); setIsNew(true); setError('');
  };

  const cancelEdit = () => {
    setEditingKey(null); setEditKey(''); setEditEn(''); setEditDv(''); setIsNew(false); setError('');
  };

  const save = async () => {
    if (!editKey.trim() || !editEn.trim() || !editDv.trim()) { setError(t.contentError); return; }
    setError('');
    const payload = { key: editKey.trim(), en: editEn.trim(), dv: editDv.trim() };
    if (isNew) {
      const { error: insertError } = await supabase.from('site_content').insert(payload);
      if (insertError) { console.error('content insert failed', insertError); setError(t.contentError); return; }
    } else if (editingKey) {
      const { error: updateError } = await supabase.from('site_content').update({ en: payload.en, dv: payload.dv }).eq('key', editingKey);
      if (updateError) { console.error('content update failed', updateError); setError(t.contentError); return; }
    }
    cancelEdit();
    load();
    onContentChange();
  };

  const remove = async (key: string) => {
    if (!window.confirm(t.deleteContentConfirm)) return;
    const { error: deleteError } = await supabase.from('site_content').delete().eq('key', key);
    if (deleteError) { console.error('content delete failed', deleteError); setError(t.contentError); return; }
    load();
    onContentChange();
  };

  const filtered = rows.filter((row) => [row.key, row.en, row.dv].join(' ').toLowerCase().includes(query.toLowerCase()));

  return <div className="content-panel">
    <div className="content-toolbar">
      <div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchContent} /></div>
      <button className="add-button" onClick={startNew}><Plus size={16} /> {t.addContent}</button>
    </div>
    {error && <div className="form-error table-error">{error}</div>}
    {loading ? <div className="content-empty">Loading…</div> : <>
      {isNew && <div className="content-edit-row">
        <label className="field"><span>{t.contentKey}</span><input value={editKey} onChange={(event) => setEditKey(event.target.value)} placeholder={t.newKeyPlaceholder} /></label>
        <label className="field"><span>{t.englishText}</span><textarea value={editEn} onChange={(event) => setEditEn(event.target.value)} /></label>
        <label className="field"><span>{t.dhivehiText}</span><textarea className="dv-input" value={editDv} onChange={(event) => setEditDv(event.target.value)} dir="rtl" /></label>
        <div className="save-actions"><button className="save-btn" onClick={save}><Save size={14} /> {t.saveContent}</button><button className="cancel-btn" onClick={cancelEdit}>{t.back}</button></div>
      </div>}
      {filtered.length === 0 && !isNew ? <div className="content-empty">{t.noResults}</div> : filtered.map((row) => (
        editingKey === row.key && !isNew ? <div className="content-edit-row" key={row.key}>
          <label className="field"><span>{t.contentKey}</span><input value={editKey} onChange={(event) => setEditKey(event.target.value)} disabled /></label>
          <label className="field"><span>{t.englishText}</span><textarea value={editEn} onChange={(event) => setEditEn(event.target.value)} /></label>
          <label className="field"><span>{t.dhivehiText}</span><textarea className="dv-input" value={editDv} onChange={(event) => setEditDv(event.target.value)} dir="rtl" /></label>
          <div className="save-actions"><button className="save-btn" onClick={save}><Save size={14} /> {t.saveContent}</button><button className="cancel-btn" onClick={cancelEdit}>{t.back}</button></div>
        </div> : <div className="content-row" key={row.key}>
          <div className="key-cell">{row.key}</div>
          <div className="text-cell">{row.en}</div>
          <div className="text-cell dv-cell" dir="rtl">{row.dv}</div>
          <div className="actions"><button className="icon-button" onClick={() => startEdit(row)} aria-label="Edit"><Pencil size={14} /></button><button className="icon-button danger" onClick={() => remove(row.key)} aria-label="Delete"><Trash2 size={14} /></button></div>
        </div>
      ))}
    </>}
  </div>;
}

function SportsManager({ t, sports, onReload }: { t: Record<string, string>; sports: Sport[]; onReload: () => void }) {
  const [newName, setNewName] = useState('');
  const [newCharge, setNewCharge] = useState('250');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCharge, setEditCharge] = useState('');
  const [error, setError] = useState('');

  const addSport = async () => {
    if (!newName.trim() || !newCharge.trim()) { setError(t.contentError); return; }
    setError('');
    const { error: insertError } = await supabase.from('sports').insert({ name: newName.trim(), charge: Number(newCharge), display_order: sports.length + 1 });
    if (insertError) { console.error('sport insert failed', insertError); setError(t.contentError); return; }
    setNewName(''); setNewCharge('250');
    onReload();
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || !editCharge.trim()) { setError(t.contentError); return; }
    setError('');
    const { error: updateError } = await supabase.from('sports').update({ name: editName.trim(), charge: Number(editCharge) }).eq('id', id);
    if (updateError) { console.error('sport update failed', updateError); setError(t.contentError); return; }
    setEditingId(null); setEditName(''); setEditCharge('');
    onReload();
  };

  const removeSport = async (id: string) => {
    if (!window.confirm(t.deleteSportConfirm)) return;
    const { error: deleteError } = await supabase.from('sports').delete().eq('id', id);
    if (deleteError) { console.error('sport delete failed', deleteError); setError(t.contentError); return; }
    onReload();
  };

  return <div className="content-panel">
    <div className="sports-add-row">
      <label className="field"><span>{t.sportName}</span><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Basketball" /></label>
      <label className="field"><span>{t.sportCharge}</span><input type="number" value={newCharge} onChange={(event) => setNewCharge(event.target.value)} /></label>
      <button className="add-button" onClick={addSport}><Plus size={16} /> {t.addSport}</button>
    </div>
    {error && <div className="form-error table-error">{error}</div>}
    {sports.length === 0 ? <div className="content-empty">{t.noResults}</div> : sports.map((sport) => (
      editingId === sport.id ? <div className="content-edit-row sports-edit-row" key={sport.id}>
        <label className="field"><span>{t.sportName}</span><input value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
        <label className="field"><span>{t.sportCharge}</span><input type="number" value={editCharge} onChange={(event) => setEditCharge(event.target.value)} /></label>
        <div className="save-actions"><button className="save-btn" onClick={() => saveEdit(sport.id)}><Save size={14} /> {t.saveContent}</button><button className="cancel-btn" onClick={() => { setEditingId(null); setError(''); }}>{t.back}</button></div>
      </div> : <div className="content-row sports-row" key={sport.id}>
        <div className="key-cell">{sport.name}</div>
        <div className="text-cell">{sport.charge}/- MVR</div>
        <div className="actions"><button className="icon-button" onClick={() => { setEditingId(sport.id); setEditName(sport.name); setEditCharge(String(sport.charge)); }} aria-label="Edit"><Pencil size={14} /></button><button className="icon-button danger" onClick={() => removeSport(sport.id)} aria-label="Delete"><Trash2 size={14} /></button></div>
      </div>
    ))}
  </div>;
}

function SettingsManager({ t, dhivehiEnabled, onDhivehiChange }: { t: Record<string, string>; dhivehiEnabled: boolean; onDhivehiChange: (value: boolean) => void }) {
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState('');

  const toggleDhivehi = async () => {
    setSaving(true); setError(''); setSavedMsg(false);
    const newValue = !dhivehiEnabled;
    const { error: updateError } = await supabase.from('site_settings').upsert({ key: 'dhivehi_enabled', value: String(newValue) });
    if (updateError) {
      console.error('settings update failed', updateError);
      setError(t.settingsError);
      setSaving(false);
      return;
    }
    onDhivehiChange(newValue);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return <div className="settings-panel">
    <div className="settings-card">
      <div className="settings-icon"><Globe size={22} /></div>
      <div className="settings-info">
        <strong>{t.dhivehiToggle}</strong>
        <span>{t.dhivehiToggleHint}</span>
      </div>
      <button className={`toggle-switch ${dhivehiEnabled ? 'on' : 'off'}`} onClick={toggleDhivehi} disabled={saving} aria-label={t.dhivehiToggle}>
        <span className="toggle-knob" />
      </button>
    </div>
    {savedMsg && <div className="settings-saved"><Check size={14} /> {t.settingsSaved}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>;
}

function PhotoModal({ application, t, onClose }: { application: Application; t: Record<string, string>; onClose: () => void }) {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const paths = [
      ['id_card_front_url', application.id_card_front_url],
      ['id_card_back_url', application.id_card_back_url],
      ['passport_photo_url', application.passport_photo_url],
      ['payment_slip_url', application.payment_slip_url],
    ] as const;
    Promise.all(paths.map(async ([key, path]) => {
      if (!path) return [key, ''] as const;
      if (path.startsWith('http')) return [key, path] as const;
      const { data, error } = await supabase.storage.from('application-photos').createSignedUrl(path, 300);
      if (error || !data?.signedUrl) return [key, ''] as const;
      return [key, data.signedUrl] as const;
    })).then((entries) => setPhotoUrls(Object.fromEntries(entries)));
  }, [application]);

  const renderPhoto = (key: string, label: string) => photoUrls[key] ? <img src={photoUrls[key]} alt={label} onClick={() => setLightboxUrl(photoUrls[key])} /> : <div className="photo-empty">{t.noResults}</div>;

  return <div className="photo-modal-overlay" onClick={onClose}>
    <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
      <div className="photo-modal-header">
        <div><strong>{application.full_name}</strong><span>{application.id_card_no} · {application.island}</span></div>
        <button className="photo-modal-close" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="photo-modal-body">
        <div className="photo-modal-item"><span>{t.idFront}</span>{renderPhoto('id_card_front_url', t.idFront)}</div>
        <div className="photo-modal-item"><span>{t.idBack}</span>{renderPhoto('id_card_back_url', t.idBack)}</div>
        <div className="photo-modal-item"><span>{t.passportPhoto}</span>{renderPhoto('passport_photo_url', t.passportPhoto)}</div>
        <div className="photo-modal-item"><span>{t.paymentSlipLabel}</span>{renderPhoto('payment_slip_url', t.paymentSlipLabel)}</div>
      </div>
    </div>
    {lightboxUrl && <div className="lightbox-overlay" onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}><button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}><X size={28} /></button><img src={lightboxUrl} alt="Full size" className="lightbox-image" onClick={(e) => e.stopPropagation()} /></div>}
  </div>;
}

function Stat({ icon, value, label, tone }: { icon: JSX.Element; value: number; label: string; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>; }

export default App;
