import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { MedicalFileData } from '../types/medicalFile';
import cordeliaLogo from '../assets/cordelia.png';

// Configure pdfmake with fonts - production-safe approach
if (typeof pdfMake.vfs === 'undefined') {
  (pdfMake as any).vfs = pdfFonts;
}

// Helper function to format date
// If the input is not a valid date, returns it as-is (no validation)
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Check if date is valid (invalid dates return NaN for getTime())
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }
    return date.toLocaleDateString('tr-TR');
  } catch {
    return dateString; // Return original string on any error
  }
};

// Helper function to format current date (for header)
const formatCurrentDate = (language: 'tr' | 'en'): string => {
  const date = new Date();
  if (language === 'tr') {
    return date.toLocaleDateString('tr-TR');
  } else {
    return date.toLocaleDateString('en-US');
  }
};

// Helper function to format timestamp (date and time for footer)
const formatTimestamp = (language: 'tr' | 'en'): string => {
  const date = new Date();
  if (language === 'tr') {
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Helper function to convert image to base64
const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

// Turkish labels and content
const turkishLabels = {
  epicrisis: {
    title: 'HASTA DOSYASI (EPİKRİZ)',
    sections: {
      patientInfo: '1. Hasta Bilgileri',
      admissionReason: '2. Başvuru Nedeni',
      generalHealth: '3. Genel Sağlık ve Geçmiş Öykü',
      preoperativeEval: '4. Ameliyat Öncesi Değerlendirme',
      procedureInfo: '5. İşlem Bilgileri',
      followUp: '6. Takip Notları',
      discharge: '7. Taburculuk Önerileri'
    },
    fields: {
      patientNumber: 'Hasta No:',
      fullName: 'Ad Soyad:',
      birthDate: 'Doğum Tarihi:',
      nationalId: 'Kimlik / Pasaport No:',
      gender: 'Cinsiyet:',
      phoneNumber: 'Telefon No:',
      address: 'Adres:',
      admissionDate: 'Kabul Tarihi:',
      surgeryDate: 'Ameliyat / İşlem Tarihi:',
      dischargeDate: 'Taburculuk Tarihi:',
      lastControlDate: 'Son Klinik Kontrol Tarihi:',
      flightEligibilityDate: 'Uçuşa Elverişlilik Tarihi:',
      hospitalName: 'Hastane / Klinik:',
      height: 'Boy (cm):',
      weight: 'Kilo (kg):',
      weightChange: 'Son 6 ayda kilo değişimi:',
      smoking: 'Sigara kullanımı:',
      alcohol: 'Alkol kullanımı:',
      chronicDiseases: 'Kronik hastalıklar:',
      medications: 'Düzenli ilaçlar:',
      allergies: 'Alerjiler:',
      previousSurgeries: 'Geçmiş ameliyatlar:',
      vitalSigns: 'Vital Bulgular:',
      physicalExam: 'Fizik Muayene:',
      plannedProcedures: 'Planlanan İşlemler:',
      operativeNotes: 'Operatif Notlar:',
      activityRestrictions: 'Aktivite Kısıtlamaları:'
    }
  },
  fitToFlight: {
    title: 'UÇUŞA UYGUNLUK BELGESİ',
    subtitle: 'FIT TO FLIGHT CERTIFICATE',
    sections: {
      patientInfo: '1. Hasta Bilgileri',
      medicalEval: '2. Tıbbi Değerlendirme',
      assessment: '3. Doktor Değerlendirmesi'
    },
    fields: {
      fullName: 'Ad Soyad:',
      birthDate: 'Doğum Tarihi:',
      nationalId: 'Pasaport veya Kimlik No:',
      gender: 'Cinsiyet:',
      phoneNumber: 'Telefon:',
      address: 'Adres:',
      surgeryDate: 'Ameliyat Tarihi:',
      dischargeDate: 'Taburculuk Tarihi:',
      hospitalName: 'Klinik:',
      procedure: 'Yapılan İşlem:',
      evalDate: 'Değerlendirme Tarihi:',
      vitalSigns: 'Vital Bulgular:',
      clinicalStatus: 'Klinik Durum:',
      medications: 'Kullanılan İlaçlar:'
    },
    assessment: 'Hasta klinik olarak değerlendirilmiş olup enfeksiyon, kanama veya instabilite bulgusu yoktur. Vital bulgular normal sınırlardadır. Hasta olağan uçuş koşullarında uçuşa uygundur.'
  },
  restReport: {
    title: 'İSTİRAHAT RAPORU',
    subtitle: 'MEDICAL REST REPORT',
    sections: {
      patientInfo: '1. Hasta Bilgileri',
      medicalCondition: '2. Tıbbi Durum',
      restRecommendation: '3. İstirahat Önerisi'
    },
    fields: {
      fullName: 'Ad Soyad:',
      birthDate: 'Doğum Tarihi:',
      nationalId: 'Kimlik No:',
      gender: 'Cinsiyet:',
      phoneNumber: 'Telefon:',
      address: 'Adres:',
      treatmentDate: 'Tedavi Tarihi:',
      hospitalName: 'Klinik:',
      diagnosis: 'Tanı:',
      treatment: 'Tedavi:',
      currentStatus: 'Mevcut Durum:',
      medications: 'İlaçlar:'
    },
    restRecommendation: 'Tıbbi değerlendirme sonucunda, hastanın taburculuk önerilerinde belirtilen aktivite kısıtlamalarına uygun olarak tıbbi istirahat alması önerilmektedir.'
  }
};

// English labels and content
const englishLabels = {
  epicrisis: {
    title: 'PATIENT FILE (EPICRISIS)',
    sections: {
      patientInfo: '1. Patient Information',
      admissionReason: '2. Admission Reason',
      generalHealth: '3. General Health and Medical History',
      preoperativeEval: '4. Preoperative Evaluation',
      procedureInfo: '5. Procedure Information',
      followUp: '6. Follow-up Notes',
      discharge: '7. Discharge Recommendations'
    },
    fields: {
      patientNumber: 'Patient No:',
      fullName: 'Full Name:',
      birthDate: 'Birth Date:',
      nationalId: 'ID / Passport No:',
      gender: 'Gender:',
      phoneNumber: 'Phone No:',
      address: 'Address:',
      admissionDate: 'Admission Date:',
      surgeryDate: 'Surgery / Procedure Date:',
      dischargeDate: 'Discharge Date:',
      lastControlDate: 'Last Clinical Control Date:',
      flightEligibilityDate: 'Flight Eligibility Date:',
      hospitalName: 'Hospital / Clinic:',
      height: 'Height (cm):',
      weight: 'Weight (kg):',
      weightChange: 'Weight change in last 6 months:',
      smoking: 'Smoking:',
      alcohol: 'Alcohol use:',
      chronicDiseases: 'Chronic diseases:',
      medications: 'Regular medications:',
      allergies: 'Allergies:',
      previousSurgeries: 'Previous surgeries:',
      vitalSigns: 'Vital Signs:',
      physicalExam: 'Physical Examination:',
      plannedProcedures: 'Planned Procedures:',
      operativeNotes: 'Operative Notes:',
      activityRestrictions: 'Activity Restrictions:'
    }
  },
  fitToFlight: {
    title: 'FIT TO FLIGHT CERTIFICATE',
    subtitle: 'FIT TO FLIGHT CERTIFICATE',
    sections: {
      patientInfo: '1. Patient Information',
      medicalEval: '2. Medical Evaluation',
      assessment: '3. Doctor\'s Assessment'
    },
    fields: {
      fullName: 'Full Name:',
      birthDate: 'Date of Birth:',
      nationalId: 'Passport or ID Number:',
      gender: 'Gender:',
      phoneNumber: 'Phone:',
      address: 'Address:',
      surgeryDate: 'Operation Date:',
      dischargeDate: 'Discharge Date:',
      hospitalName: 'Clinic:',
      procedure: 'Procedure Performed:',
      evalDate: 'Evaluation Date:',
      vitalSigns: 'Vital Signs:',
      clinicalStatus: 'Clinical Status:',
      medications: 'Medications:'
    },
    assessment: 'The patient has been clinically examined and evaluated after surgery/procedure. No signs of infection, bleeding, or hemodynamic instability are observed. Vital parameters are within normal range. Therefore, the patient is FIT TO FLY under normal flight conditions.'
  },
  restReport: {
    title: 'REST REPORT',
    subtitle: 'MEDICAL REST REPORT',
    sections: {
      patientInfo: '1. Patient Information',
      medicalCondition: '2. Medical Condition',
      restRecommendation: '3. Rest Recommendation'
    },
    fields: {
      fullName: 'Full Name:',
      birthDate: 'Date of Birth:',
      nationalId: 'ID Number:',
      gender: 'Gender:',
      phoneNumber: 'Phone:',
      address: 'Address:',
      treatmentDate: 'Treatment Date:',
      hospitalName: 'Clinic:',
      diagnosis: 'Diagnosis:',
      treatment: 'Treatment:',
      currentStatus: 'Current Status:',
      medications: 'Medications:'
    },
    restRecommendation: 'Based on the medical evaluation, the patient is recommended to take medical rest as per the activity restrictions outlined in the discharge recommendations.'
  }
};

// Generate Epicrisis Document
export const generateEpicrisisDocument = async (
  medicalFileData: MedicalFileData,
  patientData: any,
  language: 'tr' | 'en'
): Promise<{ url: string; filename: string }> => {
  const labels = language === 'tr' ? turkishLabels.epicrisis : englishLabels.epicrisis;
  
  // Convert logo to base64
  const logoBase64 = await convertImageToBase64(cordeliaLogo);
  const currentDate = formatCurrentDate(language);
  const timestamp = formatTimestamp(language);
  
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 100],
    header: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        text: currentDate,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 20, 20, 0],
        color: '#666666'
      };
    },
    footer: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        columns: [
          logoBase64 ? {
            columns: [
              {
                image: logoBase64,
                width: 30,
                alignment: 'left'
              },
              {
                text: 'Cordelia',
                fontSize: 12,
                bold: true,
                alignment: 'left',
                margin: [5, 7, 0, 0],
                color: '#666666'
              }
            ]
          } : { text: '' },
          {
            text: timestamp,
            alignment: 'right',
            fontSize: 9,
            margin: [0, 10, 0, 10],
            color: '#666666'
          }
        ],
        margin: [40, 10, 40, 10]
      };
    },
    content: [
  // Title
      {
        text: labels.title,
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
  
  // Patient Information Section
      {
        text: labels.sections.patientInfo,
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.patientNumber, medicalFileData.patientInfo.patientNumber || '___________'],
            [labels.fields.fullName, medicalFileData.patientInfo.fullName || '___________'],
            [labels.fields.birthDate, formatDate(medicalFileData.patientInfo.birthDate) || '___________'],
            [labels.fields.nationalId, medicalFileData.patientInfo.nationalId || '___________'],
            [labels.fields.gender, medicalFileData.patientInfo.gender || '___________'],
            [labels.fields.phoneNumber, medicalFileData.patientInfo.phoneNumber || '___________'],
            [labels.fields.address, medicalFileData.patientInfo.address || '___________'],
            [labels.fields.admissionDate, formatDate(medicalFileData.patientInfo.admissionDate) || '___________'],
            [labels.fields.surgeryDate, formatDate(medicalFileData.patientInfo.surgeryDate) || '___________'],
            [labels.fields.dischargeDate, formatDate(medicalFileData.patientInfo.dischargeDate) || '___________'],
            [labels.fields.lastControlDate, formatDate(medicalFileData.patientInfo.lastControlDate) || '___________'],
            [labels.fields.flightEligibilityDate, formatDate(medicalFileData.patientInfo.flightEligibilityDate) || '___________'],
            [labels.fields.hospitalName, medicalFileData.patientInfo.hospitalName || '___________']
          ]
        },
        layout: 'noBorders'
      },
  
  // Admission Reason Section
      {
        text: labels.sections.admissionReason,
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        text: medicalFileData.admissionReason || '___________',
        fontSize: 10,
        margin: [0, 0, 0, 20]
      },
  
  // General Health History Section
      {
        text: labels.sections.generalHealth,
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.height, medicalFileData.generalHealthHistory.height || '___________'],
            [labels.fields.weight, medicalFileData.generalHealthHistory.weight || '___________'],
            [labels.fields.weightChange, medicalFileData.generalHealthHistory.weightChange || '___________'],
            [labels.fields.smoking, medicalFileData.generalHealthHistory.smoking || '___________'],
            [labels.fields.alcohol, medicalFileData.generalHealthHistory.alcohol || '___________'],
            [labels.fields.chronicDiseases, medicalFileData.generalHealthHistory.chronicDiseases || '___________'],
            [labels.fields.medications, medicalFileData.generalHealthHistory.medications || '___________'],
            [labels.fields.allergies, medicalFileData.generalHealthHistory.allergies || '___________'],
            [labels.fields.previousSurgeries, medicalFileData.generalHealthHistory.previousSurgeries || '___________']
          ]
        },
        layout: 'noBorders'
      },
      
      // Preoperative Evaluation Section
      {
        text: labels.sections.preoperativeEval,
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10],
        pageBreak: 'before'
      },
      {
        table: {
          body: [
            [labels.fields.vitalSigns, medicalFileData.preoperativeEvaluation.vitalSigns || '___________'],
            [labels.fields.physicalExam, medicalFileData.preoperativeEvaluation.physicalExam || '___________']
          ]
        },
        layout: 'noBorders'
      },
      
      // Procedure Information Section
      {
        text: labels.sections.procedureInfo,
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.plannedProcedures, medicalFileData.procedureInfo.plannedProcedures || '___________'],
            [labels.fields.operativeNotes, medicalFileData.procedureInfo.operativeNotes || '___________']
          ]
        },
        layout: 'noBorders'
      },
      
      // Follow-up Notes Section
      {
        text: labels.sections.followUp,
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        text: medicalFileData.followUpNotes || '___________',
        fontSize: 10,
        margin: [0, 0, 0, 20]
      },
      
      // Discharge Recommendations Section
      {
        text: labels.sections.discharge,
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.medications, medicalFileData.dischargeRecommendations.medications || '___________'],
            [labels.fields.activityRestrictions, medicalFileData.dischargeRecommendations.activityRestrictions || '___________']
          ]
        },
        layout: 'noBorders'
      }
    ],
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.2
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  const pdfBlob = await new Promise<Blob>((resolve) => {
    pdfDocGenerator.getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
  
  const url = URL.createObjectURL(pdfBlob);
  const filename = `epicrisis_${medicalFileData.patientInfo.fullName || 'hasta'}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { url, filename };
};

// Generate Fit to Flight Certificate
export const generateFitToFlightDocument = async (
  medicalFileData: MedicalFileData,
  patientData: any,
  language: 'tr' | 'en'
): Promise<{ url: string; filename: string }> => {
  const labels = language === 'tr' ? turkishLabels.fitToFlight : englishLabels.fitToFlight;
  
  // Convert logo to base64
  const logoBase64 = await convertImageToBase64(cordeliaLogo);
  const currentDate = formatCurrentDate(language);
  const timestamp = formatTimestamp(language);
  
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 100],
    header: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        text: currentDate,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 20, 20, 0],
        color: '#666666'
      };
    },
    footer: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        columns: [
          logoBase64 ? {
            columns: [
              {
                image: logoBase64,
                width: 30,
                alignment: 'left'
              },
              {
                text: 'Cordelia',
                fontSize: 12,
                bold: true,
                alignment: 'left',
                margin: [5, 0, 0, 0],
                color: '#666666'
              }
            ]
          } : { text: '' },
          {
            text: timestamp,
            alignment: 'right',
            fontSize: 9,
            margin: [0, 10, 0, 10],
            color: '#666666'
          }
        ],
        margin: [40, 10, 40, 10]
      };
    },
    content: [
  // Title
      {
        text: labels.title,
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
  
  // Patient Information Section
      {
        text: labels.sections.patientInfo,
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.fullName, medicalFileData.patientInfo.fullName || '___________'],
            [labels.fields.birthDate, formatDate(medicalFileData.patientInfo.birthDate) || '___________'],
            [labels.fields.nationalId, medicalFileData.patientInfo.nationalId || '___________'],
            [labels.fields.gender, medicalFileData.patientInfo.gender || '___________'],
            [labels.fields.phoneNumber, medicalFileData.patientInfo.phoneNumber || '___________'],
            [labels.fields.address, medicalFileData.patientInfo.address || '___________'],
            [labels.fields.surgeryDate, formatDate(medicalFileData.patientInfo.surgeryDate) || '___________'],
            [labels.fields.dischargeDate, formatDate(medicalFileData.patientInfo.dischargeDate) || '___________'],
            [labels.fields.hospitalName, medicalFileData.patientInfo.hospitalName || '___________']
          ]
        },
        layout: 'noBorders'
      },
  
  // Medical Evaluation Section
      {
        text: labels.sections.medicalEval,
        fontSize: 12,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.procedure, medicalFileData.procedureInfo.plannedProcedures || '___________'],
            [labels.fields.evalDate, formatDate(medicalFileData.patientInfo.lastControlDate) || '___________'],
            [labels.fields.vitalSigns, medicalFileData.preoperativeEvaluation.vitalSigns || '___________'],
            [labels.fields.clinicalStatus, medicalFileData.preoperativeEvaluation.physicalExam || '___________'],
            [labels.fields.medications, medicalFileData.dischargeRecommendations.medications || '___________']
          ]
        },
        layout: 'noBorders'
      },
      
      // Doctor's Assessment Section
      {
        text: labels.sections.assessment,
        fontSize: 12,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        text: labels.assessment,
        fontSize: 10,
        margin: [0, 0, 0, 20]
      }
    ],
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.2
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  const pdfBlob = await new Promise<Blob>((resolve) => {
    pdfDocGenerator.getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
  
  const url = URL.createObjectURL(pdfBlob);
  const filename = `fit_to_flight_${medicalFileData.patientInfo.fullName || 'hasta'}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { url, filename };
};

// Generate Rest Report
export const generateRestReportDocument = async (
  medicalFileData: MedicalFileData,
  patientData: any,
  language: 'tr' | 'en'
): Promise<{ url: string; filename: string }> => {
  const labels = language === 'tr' ? turkishLabels.restReport : englishLabels.restReport;
  
  // Convert logo to base64
  const logoBase64 = await convertImageToBase64(cordeliaLogo);
  const currentDate = formatCurrentDate(language);
  const timestamp = formatTimestamp(language);
  
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 100],
    header: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        text: currentDate,
        alignment: 'right',
        fontSize: 9,
        margin: [0, 20, 20, 0],
        color: '#666666'
      };
    },
    footer: function(currentPage: number, pageCount: number) {
      void currentPage;
      void pageCount;
      return {
        columns: [
          logoBase64 ? {
            columns: [
              {
                image: logoBase64,
                width: 30,
                alignment: 'left'
              },
              {
                text: 'Cordelia',
                fontSize: 12,
                bold: true,
                alignment: 'left',
                margin: [5, 0, 0, 0],
                color: '#666666'
              }
            ]
          } : { text: '' },
          {
            text: timestamp,
            alignment: 'right',
            fontSize: 9,
            margin: [0, 10, 0, 10],
            color: '#666666'
          }
        ],
        margin: [40, 10, 40, 10]
      };
    },
    content: [
  // Title
      {
        text: labels.title,
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
  
  // Patient Information Section
      {
        text: labels.sections.patientInfo,
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.fullName, medicalFileData.patientInfo.fullName || '___________'],
            [labels.fields.birthDate, formatDate(medicalFileData.patientInfo.birthDate) || '___________'],
            [labels.fields.nationalId, medicalFileData.patientInfo.nationalId || '___________'],
            [labels.fields.gender, medicalFileData.patientInfo.gender || '___________'],
            [labels.fields.phoneNumber, medicalFileData.patientInfo.phoneNumber || '___________'],
            [labels.fields.address, medicalFileData.patientInfo.address || '___________'],
            [labels.fields.treatmentDate, formatDate(medicalFileData.patientInfo.surgeryDate) || '___________'],
            [labels.fields.hospitalName, medicalFileData.patientInfo.hospitalName || '___________']
          ]
        },
        layout: 'noBorders'
      },
  
  // Medical Condition Section
      {
        text: labels.sections.medicalCondition,
        fontSize: 12,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          body: [
            [labels.fields.diagnosis, medicalFileData.admissionReason || '___________'],
            [labels.fields.treatment, medicalFileData.procedureInfo.plannedProcedures || '___________'],
            [labels.fields.currentStatus, medicalFileData.followUpNotes || '___________'],
            [labels.fields.medications, medicalFileData.dischargeRecommendations.medications || '___________']
          ]
        },
        layout: 'noBorders'
      },
      
      // Rest Recommendation Section
      {
        text: labels.sections.restRecommendation,
        fontSize: 12,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      {
        text: labels.restRecommendation,
        fontSize: 10,
        margin: [0, 0, 0, 10]
      },
      {
        text: `${language === 'tr' ? 'Aktivite Kısıtlamaları:' : 'Activity Restrictions:'}\n${medicalFileData.dischargeRecommendations.activityRestrictions || (language === 'tr' ? 'Belirtilmemiş' : 'Not specified')}`,
        fontSize: 10,
        margin: [0, 0, 0, 20]
      }
    ],
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.2
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  const pdfBlob = await new Promise<Blob>((resolve) => {
    pdfDocGenerator.getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
  
  const url = URL.createObjectURL(pdfBlob);
  const filename = `rest_report_${medicalFileData.patientInfo.fullName || 'hasta'}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { url, filename };
};