import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Activity
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';

const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end,
  suffix = '',
  duration = 2
}) => {
  const [count, setCount] = React.useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true });

  return (
    <>
      <Helmet>
        <title>Cordelia - Tıbbi Randevu ve Hasta Yönetim Platformu</title>
        <meta name="description" content="Cordelia ile randevularınızı dijital ortamda yönetin, hasta kayıtlarınızı güvenle saklayın ve ekibinizle kolayca iletişim kurun." />
        <meta name="keywords" content="tıbbi randevu, hasta yönetimi, dijital platform, sağlık, doktor, klinik" />
        <meta property="og:title" content="Cordelia - Tıbbi Randevu ve Hasta Yönetim Platformu" />
        <meta property="og:description" content="Modern tıbbi randevu ve hasta yönetim sistemi" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <PublicHeader />

        <section ref={heroRef} className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <Activity className="w-4 h-4 mr-2" />
                  Klinik Süreçleri Basitleştirir, Hizmet Kalitesini Artırır
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              >
                Zamanınızı Veri Girişi Değil, Değer Yaratma Doldursun
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-xl md:text-2xl text-gray-600 mb-6 max-w-4xl mx-auto leading-relaxed"
              >
                Randevu, epikriz, PDF hazırlama, arşivleme, formlar, notlar, koordinasyon…
                <br />
                <span className="text-gray-800 font-semibold">Hepsini AI asistana devredin.</span>
                <br />
                Siz hastanıza kulak verin, veriyi Cordelia'ya halletsin.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="inline-block mb-10"
              >
                <span className="inline-flex items-center px-5 py-2 text-large rounded-full bg-white text-gray-700 font-medium shadow-sm">
                  Hastanızın ihtiyacı teknoloji değil, sizin ilginiz.
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/auth">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                  >
                    Cordelia'yı Deneyin
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <Link to="/about">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Nasıl Çalışır?
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section ref={statsRef} className="py-16 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { end: 500, suffix: '+', label: 'Aktif Kullanıcı' },
                { end: 10000, suffix: '+', label: 'Tamamlanan Randevu' },
                { end: 99, suffix: '%', label: 'Müşteri Memnuniyeti' },
                { end: 24, suffix: '/7', label: 'Destek Hizmeti' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isStatsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">
                    <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Neden Cordelia?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Modern tıbbi pratikler için tasarlanmış kapsamlı özellikler
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-emerald-600" />}
                title="AI Sekreter"
                description="Not alır, özetler, arşivler"
                delay={0}
              />
              <FeatureCard
                icon={<FileText className="w-6 h-6 text-emerald-600" />}
                title="Belge Otomasyonu"
                description="Epikriz, onam, rapor, reçete: tek tuşla hazır"
                delay={0.1}
              />
              <FeatureCard
                icon={<Calendar className="w-6 h-6 text-emerald-600" />}
                title="Randevu & Hasta Takibi"
                description="Randevu – hatırlatma – CRM"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Nasıl Çalışır?
              </h2>
              <p className="text-xl text-emerald-50">
                Üç basit adımda başlayın
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Kayıt Olun',
                  description: 'Birkaç dakikada ücretsiz hesabınızı oluşturun ve sisteme hemen erişin.'
                },
                {
                  step: '02',
                  title: 'Sistemi Kurun',
                  description: 'Kliniğiniz için gerekli ayarları yapın. Ekibinizi ve randevu saatlerinizi tanımlayın.'
                },
                {
                  step: '03',
                  title: 'Kullanmaya Başlayın',
                  description: 'Randevularınızı yönetmeye başlayın. Tüm özelliklerden anında faydalanın.'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white"
                >
                  <div className="text-5xl font-bold text-emerald-200 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-emerald-50 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Kullanıcılarımız Ne Diyor?
              </h2>
              <p className="text-xl text-gray-600">
                Binlerce sağlık profesyonelinin tercihi
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Dr. Ayşe Yılmaz',
                  role: 'Genel Pratisyen',
                  content: 'Cordelia sayesinde randevu yönetimim çok daha kolay. Hasta kayıtlarına her yerden erişebiliyorum.',
                  rating: 5
                },
                {
                  name: 'Dr. Mehmet Kaya',
                  role: 'Diş Hekimi',
                  content: 'Kullanımı çok basit ve pratik. Ekibimle koordinasyonumuz çok daha verimli hale geldi.',
                  rating: 5
                },
                {
                  name: 'Dr. Zeynep Demir',
                  role: 'Dermatoloji Uzmanı',
                  content: 'Güvenli veri saklama ve kullanıcı dostu arayüz tam olarak ihtiyacım olan şeydi.',
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{testimonial.content}</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Cordelia: Aradaki Kağıtları Değil, Hastayla Bağı Güçlendirir.
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Ücretsiz hesabınızı oluşturun ve tüm özellikleri keşfedin
              </p>
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg shadow-xl transition-all inline-flex items-center"
                >
                  Ücretsiz Deneyin
                  <CheckCircle className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Cordelia</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Modern tıbbi randevu ve hasta yönetim platformu
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Ürün</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Özellikler</Link></li>
                  <li><Link to="/about" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Hakkımızda</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Destek</h4>
                <ul className="space-y-2">
                  <li><Link to="/contact" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">İletişim</Link></li>
                  <li><a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Yardım Merkezi</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Yasal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Gizlilik Politikası</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Kullanım Koşulları</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2024 Cordelia. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
