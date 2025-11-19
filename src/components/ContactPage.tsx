import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad soyad gereklidir';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email gereklidir';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon gereklidir';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Konu gereklidir';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Mesaj gereklidir';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mesaj en az 10 karakter olmalıdır';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });

    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <Helmet>
        <title>İletişim - Cordelia</title>
        <meta name="description" content="Cordelia hakkında sorularınız mı var? Bizimle iletişime geçin. Size yardımcı olmaktan mutluluk duyarız." />
        <meta property="og:title" content="İletişim - Cordelia" />
        <meta property="og:description" content="Cordelia destek ekibi ile iletişime geçin" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <PublicHeader />

        <section className="pt-32 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6"
              >
                İletişim
              </motion.span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Size{' '}
                <span className="text-emerald-600">Yardımcı Olalım</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Sorularınız, önerileriniz veya destek talepleriniz için bizimle
                iletişime geçin. En kısa sürede size dönüş yapacağız.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-2">Bize email gönderin</p>
                <a href="mailto:info@cordelia.app" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  info@cordelia.app
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Telefon</h3>
                <p className="text-gray-600 mb-2">Bizi arayın</p>
                <a href="tel:+902121234567" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  +90 (212) 123 45 67
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Çalışma Saatleri</h3>
                <p className="text-gray-600 mb-2">Hafta içi</p>
                <p className="text-emerald-600 font-medium">09:00 - 18:00</p>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-xl p-8 md:p-10"
              >
                <div className="flex items-center mb-6">
                  <MessageSquare className="w-6 h-6 text-emerald-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Bize Mesaj Gönderin</h2>
                </div>

                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <p className="text-emerald-700">
                      Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.name ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Dr. Ahmet Yılmaz"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="doktor@hastane.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.phone ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="5XX XXX XX XX"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konu <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        errors.subject ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Konu seçin</option>
                      <option value="demo">Demo Talebi</option>
                      <option value="support">Teknik Destek</option>
                      <option value="sales">Satış</option>
                      <option value="feedback">Geri Bildirim</option>
                      <option value="other">Diğer</option>
                    </select>
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                        errors.message ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Mesajınızı buraya yazın..."
                    />
                    {errors.message && (
                      <p className="text-sm text-red-600 mt-1">{errors.message}</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        Mesajı Gönder
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <MapPin className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Adres</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Maslak Mahallesi<br />
                    Büyükdere Caddesi No: 255<br />
                    Nurol Plaza B Blok Kat:19<br />
                    34398 Sarıyer / İstanbul
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Sıkça Sorulan Sorular</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">Cordelia ücretsiz mi?</h4>
                      <p className="text-emerald-50 text-sm">
                        Evet, temel özelliklerle ücretsiz kullanabilirsiniz. Premium özellikler için farklı planlarımız mevcut.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Teknik destek sunuyor musunuz?</h4>
                      <p className="text-emerald-50 text-sm">
                        Evet, tüm kullanıcılarımıza 7/24 email desteği sunuyoruz. Premium kullanıcılar telefon desteği alabilir.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Verilerim güvende mi?</h4>
                      <p className="text-emerald-50 text-sm">
                        Evet, KVKK uyumlu altyapımız ve şifreli veri saklama sistemimiz ile verileriniz en üst düzeyde korunur.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Demo Talebi</h3>
                  <p className="text-gray-600 mb-4">
                    Cordelia'yı daha yakından tanımak ister misiniz? Size özel bir demo sunabiliriz.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Demo Talep Et
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 py-12 px-4">
          <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
            <p>&copy; 2024 Cordelia. Tüm hakları saklıdır.</p>
          </div>
        </footer>
      </div>
    </>
  );
};
