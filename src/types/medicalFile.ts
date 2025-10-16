// Medical File TypeScript Interfaces and Field Configuration

export interface PatientInfo {
  patientNumber: string;
  fullName: string;
  birthDate: string;
  nationalId: string;
  gender: string;
  phoneNumber: string;
  address: string;
  admissionDate: string;
  surgeryDate: string;
  dischargeDate: string;
  lastControlDate: string;
  flightEligibilityDate: string;
  hospitalName: string;
}

export interface GeneralHealthHistory {
  height: string;
  weight: string;
  weightChange: string;
  smoking: string;
  alcohol: string;
  drugs: string;
  supplements: string;
  dentalTreatments: string;
  chronicDiseases: string;
  medications: string;
  allergies: string;
  previousSurgeries: string;
  bleedingDisorder: string;
  miscarriage: string;
  thrombosis: string;
}

export interface PreoperativeEvaluation {
  vitalSigns: string;
  physicalExam: string;
  labResults: string;
  otherNotes: string;
}

export interface ProcedureInfo {
  plannedProcedures: string;
  anesthesiaType: string;
  duration: string;
  operativeNotes: string;
}

export interface DischargeRecommendations {
  medications: string;
  woundCare: string;
  activityRestrictions: string;
  nextControlDate: string;
}

export interface MedicalFileData {
  patientInfo: PatientInfo;
  admissionReason: string;
  generalHealthHistory: GeneralHealthHistory;
  preoperativeEvaluation: PreoperativeEvaluation;
  procedureInfo: ProcedureInfo;
  followUpNotes: string;
  dischargeRecommendations: DischargeRecommendations;
}

// Field configuration for form rendering
export const MEDICAL_FILE_FIELDS = {
  patientInfo: [
    { key: 'patientNumber', label: 'Hasta No', type: 'input' },
    { key: 'fullName', label: 'Ad Soyad', type: 'input' },
    { key: 'birthDate', label: 'Doğum Tarihi', type: 'input' },
    { key: 'nationalId', label: 'Kimlik / Pasaport No', type: 'input' },
    { key: 'gender', label: 'Cinsiyet', type: 'input' },
    { key: 'phoneNumber', label: 'Telefon No', type: 'input' },
    { key: 'address', label: 'Adres (Şehir, Ülke)', type: 'input' },
    { key: 'admissionDate', label: 'Kabul Tarihi', type: 'input' },
    { key: 'surgeryDate', label: 'Ameliyat / İşlem Tarihi', type: 'input' },
    { key: 'dischargeDate', label: 'Taburculuk Tarihi', type: 'input' },
    { key: 'lastControlDate', label: 'Son Klinik Kontrol Tarihi', type: 'input' },
    { key: 'flightEligibilityDate', label: 'Uçuşa Elverişlilik Tarihi (varsa)', type: 'input' },
    { key: 'hospitalName', label: 'Ameliyat / İşlemin Yapıldığı Hastane / Klinik', type: 'input' }
  ],
  generalHealthHistory: [
    { key: 'height', label: 'Boy (cm)', type: 'input' },
    { key: 'weight', label: 'Kilo (kg)', type: 'input' },
    { key: 'weightChange', label: 'Son 6 ayda belirgin kilo değişimi (>5 kg)', type: 'input' },
    { key: 'smoking', label: 'Sigara / Nikotin kullanımı', type: 'input' },
    { key: 'alcohol', label: 'Alkol kullanımı', type: 'input' },
    { key: 'drugs', label: 'Uyuşturucu madde kullanımı', type: 'input' },
    { key: 'supplements', label: 'Takviye ürünler', type: 'input' },
    { key: 'dentalTreatments', label: 'Devam eden diş tedavileri', type: 'input' },
    { key: 'chronicDiseases', label: 'Kronik hastalıklar', type: 'input' },
    { key: 'medications', label: 'Düzenli kullanılan ilaçlar', type: 'input' },
    { key: 'allergies', label: 'Alerjiler (ilaç / gıda / lateks)', type: 'input' },
    { key: 'previousSurgeries', label: 'Geçirilmiş ameliyatlar (yıl ile birlikte)', type: 'input' },
    { key: 'bleedingDisorder', label: 'Kanama bozukluğu öyküsü', type: 'input' },
    { key: 'miscarriage', label: 'Düşük (abortus) öyküsü', type: 'input' },
    { key: 'thrombosis', label: 'Derin ven trombozu veya emboli öyküsü', type: 'input' }
  ],
  preoperativeEvaluation: [
    { key: 'vitalSigns', label: 'Vital bulgular', type: 'input' },
    { key: 'physicalExam', label: 'Fizik muayene bulguları', type: 'input' },
    { key: 'labResults', label: 'Laboratuvar ve görüntüleme sonuçları', type: 'input' },
    { key: 'otherNotes', label: 'Diğer notlar', type: 'input' }
  ],
  procedureInfo: [
    { key: 'plannedProcedures', label: 'Planlanan işlem(ler)', type: 'input' },
    { key: 'anesthesiaType', label: 'Anestezi tipi', type: 'input' },
    { key: 'duration', label: 'Süre', type: 'input' },
    { key: 'operativeNotes', label: 'Operatif / İşlem Notları', type: 'textarea' }
  ],
  dischargeRecommendations: [
    { key: 'medications', label: 'Taburculukta verilen ilaçlar', type: 'input' },
    { key: 'woundCare', label: 'Yara / işlem bölgesi bakımı', type: 'input' },
    { key: 'activityRestrictions', label: 'Aktivite kısıtlamaları', type: 'input' },
    { key: 'nextControlDate', label: 'Sonraki kontrol tarihi', type: 'input' }
  ]
};

// Tab configuration
export const MEDICAL_FILE_TABS = [
  { id: 'patientInfo', label: 'Hasta Bilgileri', icon: 'User' },
  { id: 'admissionReason', label: 'Başvuru Nedeni', icon: 'FileText' },
  { id: 'generalHealthHistory', label: 'Genel Sağlık ve Geçmiş Öykü', icon: 'Heart' },
  { id: 'preoperativeEvaluation', label: 'Preoperatif / İlk Klinik Değerlendirme', icon: 'Stethoscope' },
  { id: 'procedureInfo', label: 'Yapılan İşlem / Tedavi Bilgileri', icon: 'Activity' },
  { id: 'followUpNotes', label: 'Takip Notları', icon: 'Clipboard' },
  { id: 'dischargeRecommendations', label: 'Taburculuk ve Öneriler', icon: 'CheckCircle' }
];

// Default empty medical file data
export const createEmptyMedicalFile = (): MedicalFileData => ({
  patientInfo: {
    patientNumber: '',
    fullName: '',
    birthDate: '',
    nationalId: '',
    gender: '',
    phoneNumber: '',
    address: '',
    admissionDate: '',
    surgeryDate: '',
    dischargeDate: '',
    lastControlDate: '',
    flightEligibilityDate: '',
    hospitalName: ''
  },
  admissionReason: '',
  generalHealthHistory: {
    height: '',
    weight: '',
    weightChange: '',
    smoking: '',
    alcohol: '',
    drugs: '',
    supplements: '',
    dentalTreatments: '',
    chronicDiseases: '',
    medications: '',
    allergies: '',
    previousSurgeries: '',
    bleedingDisorder: '',
    miscarriage: '',
    thrombosis: ''
  },
  preoperativeEvaluation: {
    vitalSigns: '',
    physicalExam: '',
    labResults: '',
    otherNotes: ''
  },
  procedureInfo: {
    plannedProcedures: '',
    anesthesiaType: '',
    duration: '',
    operativeNotes: ''
  },
  followUpNotes: '',
  dischargeRecommendations: {
    medications: '',
    woundCare: '',
    activityRestrictions: '',
    nextControlDate: ''
  }
});

