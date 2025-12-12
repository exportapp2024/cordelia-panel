import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, FileText, Zap, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';

export const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Fiyatlandırma bilgileri (örnek değerler - BRD'ye göre düzenlenebilir)
  const monthlyPricePerSeat = 10; // $/seat/ay
  const yearlyPricePerSeat = monthlyPricePerSeat * 12 * 0.6; // %40 indirimli
  const yearlyMonthlyEquivalent = yearlyPricePerSeat / 12;

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      title: 'Yapay zeka destekli hata kaydı',
      description: 'Klinik süreçlerinizde yaşanan hataları hızlıca kaydedebilir, sınıflandırabilir ve tekrar eden sorunları akıllı analizlerle görebilirsiniz.'
    },
    {
      icon: <Calendar className="w-6 h-6 text-emerald-600" />,
      title: 'Akıllı randevu oluşturma',
      description: 'Hasta randevularını saniyeler içinde oluşturabilir, doktor ve klinik uygunluğunu otomatik kontrol ettirebilirsiniz.'
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      title: 'Tüm süreci uçtan uca takip',
      description: 'Oluşturulan her hata kaydının ve randevunun durumunu anlık olarak izleyebilir, ne aşamada olduğunu görebilir, gecikmeleri ve riskleri önceden tespit edebilirsiniz.'
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      title: 'Tamamen yapay zeka destekli iş akışları',
      description: 'Cordelia, verilerinizden öğrenerek size öneriler sunar: Hangi tip hatalar sık tekrarlanıyor? Hangi zaman dilimlerinde randevu yoğunluğu artıyor? Hangi süreçlerde iyileştirme fırsatları var?'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Fiyatlandırma - Cordelia</title>
        <meta name="description" content="Cordelia fiyatlandırma planları. 90 günlük ücretsiz deneme ile başlayın. Per seat lisanslama modeli ile esnek ödeme seçenekleri." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <PublicHeader />

        {/* Pricing Card Section */}
        <section className="pt-32 pb-12 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-emerald-100 relative overflow-hidden">
                {/* Billing Period Toggle - Sol Üst */}
                <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
                  <div className="flex items-center gap-3 bg-white rounded-lg shadow-md px-3 py-2">
                    <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Aylık
                    </span>
                    <button
                      onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                        billingPeriod === 'yearly' ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                        animate={{
                          x: billingPeriod === 'yearly' ? 28 : 0
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                    <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Yıllık
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"
                    >
                      %40 Tasarruf
                    </motion.span>
                  )}
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Cordelia Pro
                  </h2>
                  <p className="text-gray-600 text-lg mb-6">
                    Tüm özelliklere tam erişim
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl md:text-6xl font-bold text-gray-900">
                        {billingPeriod === 'monthly' 
                          ? `$${monthlyPricePerSeat}`
                          : `$${yearlyMonthlyEquivalent.toFixed(2)}`
                        }
                      </span>
                      <span className="text-xl text-gray-600">
                        /koltuk/ay
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Yıllık faturalandırılır (${yearlyPricePerSeat.toFixed(2)}/koltuk/yıl)
                      </p>
                    )}
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4 mb-8">
                    <p className="text-sm text-emerald-800 font-medium">
                      <strong>Per Seat Per Month</strong> lisanslama modeli ile ihtiyacınız kadar koltuk satın alın.
                      <br />
                      Seat sayısını istediğiniz zaman artırabilir veya azaltabilirsiniz.
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Dahil Olan Özellikler:</h3>
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Additional Benefits */}
                <div className="border-t border-gray-200 pt-6 mb-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700">90 günlük ücretsiz deneme</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700">Kredi kartı zorunlu değil</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700">İstediğiniz zaman iptal edin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700">7/24 destek hizmeti</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Satın Al
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Deneme süresi bitmeden istediğiniz zaman satın alma yapabilirsiniz
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nasıl Çalışır?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: '90 Gün Ücretsiz Deneme',
                  description: 'Kayıt olduğunuzda otomatik olarak 90 günlük ücretsiz deneme başlar. Tüm özelliklere tam erişim sağlarsınız.'
                },
                {
                  step: '2',
                  title: 'Plan Seçin',
                  description: 'Deneme süresi bitmeden veya sonrasında, aylık veya yıllık plan seçerek devam edebilirsiniz. Yıllık plan %40 daha avantajlıdır.'
                },
                {
                  step: '3',
                  title: 'Koltuk Sayısını Belirleyin',
                  description: 'Per seat per month modeli ile ihtiyacınız kadar koltuk satın alın. Seat sayısını istediğiniz zaman güncelleyebilirsiniz.'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 shadow-lg text-center"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Sık Sorulan Sorular
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  question: 'Deneme süresi sonunda ne olur?',
                  answer: '90 günlük deneme süresi sonunda herhangi bir ücretli plana geçmezseniz, hesabınız read-only moda düşer. Verilerinize erişmeye devam edebilirsiniz, ancak yeni işlem yapmak için bir plan seçmeniz gerekir.'
                },
                {
                  question: 'Yıllık planın avantajı nedir?',
                  answer: 'Yıllık plan, aylık planlara göre %40 daha avantajlıdır. Aylık eşdeğer fiyat olarak hesaplanır ve yıllık olarak faturalandırılır.'
                },
                {
                  question: 'Seat sayısını değiştirebilir miyim?',
                  answer: 'Evet, seat sayısını istediğiniz zaman artırabilir veya azaltabilirsiniz. Değişiklikler bir sonraki faturalandırma döneminde yansıtılır.'
                },
                {
                  question: 'Kredi kartı bilgisi gerekli mi?',
                  answer: 'Hayır, 90 günlük deneme süresi için kredi kartı bilgisi gerekmez. Deneme süresi bitmeden plan seçmek istediğinizde ödeme bilgilerinizi girebilirsiniz.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Hemen Başlayın
              </h2>
              <p className="text-xl text-emerald-50 mb-10">
                90 gün boyunca tüm özellikleri ücretsiz deneyin. Kredi kartı zorunlu değil.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white hover:bg-gray-50 text-emerald-600 rounded-lg font-semibold text-lg shadow-xl transition-all inline-flex items-center gap-2"
              >
                Ücretsiz Deneyin
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

