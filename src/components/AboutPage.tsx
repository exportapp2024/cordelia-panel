import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';
import {
  Target,
  Eye,
  Heart,
  Users,
  Award,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const ValueCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl p-6 shadow-lg"
  >
    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

export const AboutPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Hakkımızda - Cordelia</title>
        <meta name="description" content="Cordelia, sağlık profesyonellerinin randevu ve hasta yönetimini kolaylaştırmak için tasarlanmış modern bir platformdur." />
        <meta property="og:title" content="Hakkımızda - Cordelia" />
        <meta property="og:description" content="Sağlık profesyonelleri için modern randevu ve hasta yönetim platformu" />
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
                Hakkımızda
              </motion.span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Sağlık Sektöründe{' '}
                <span className="text-emerald-600">Dijital Dönüşüm</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Cordelia, sağlık profesyonellerinin günlük işlerini kolaylaştırmak ve
                hasta deneyimini iyileştirmek için tasarlanmış modern bir platformdur.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-20"
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Hikayemiz</h2>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>
                      Cordelia, sağlık sektöründe yaşanan operasyonel zorlukları çözmek
                      amacıyla doğdu. Sağlık profesyonellerinin karmaşık randevu sistemleri,
                      kağıt tabanlı hasta kayıtları ve verimsiz iletişim yöntemleriyle
                      mücadele ettiğini gördük.
                    </p>
                    <p>
                      Teknoloji ve sağlık sektörü uzmanlarından oluşan ekibimiz, modern
                      bir çözüm geliştirmek için bir araya geldi. Amacımız, sağlık
                      profesyonellerinin asıl işlerine odaklanabilmeleri için idari yükü
                      minimuma indirmekti.
                    </p>
                    <p>
                      Bugün, yüzlerce sağlık profesyoneli Cordelia'yı kullanarak daha
                      verimli çalışıyor ve daha iyi hasta deneyimi sunuyor.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-emerald-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
                    <div className="text-sm text-gray-600 font-medium">Aktif Kullanıcı</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-blue-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
                    <div className="text-sm text-gray-600 font-medium">Randevu</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-purple-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-4xl font-bold text-purple-600 mb-2">99%</div>
                    <div className="text-sm text-gray-600 font-medium">Memnuniyet</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-orange-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className="text-sm text-gray-600 font-medium">Destek</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-20">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-10 text-white"
              >
                <Target className="w-12 h-12 mb-6" />
                <h3 className="text-3xl font-bold mb-4">Misyonumuz</h3>
                <p className="text-emerald-50 leading-relaxed text-lg">
                  Sağlık profesyonellerinin işlerini kolaylaştıran, hasta deneyimini
                  iyileştiren ve verimliliği artıran dijital çözümler sunarak sağlık
                  sektörünün dijital dönüşümüne öncülük etmek.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white"
              >
                <Eye className="w-12 h-12 mb-6" />
                <h3 className="text-3xl font-bold mb-4">Vizyonumuz</h3>
                <p className="text-blue-50 leading-relaxed text-lg">
                  Türkiye'nin en çok tercih edilen sağlık yönetim platformu olmak ve
                  her sağlık profesyonelinin günlük iş akışını optimize ederek daha
                  kaliteli sağlık hizmeti sunmalarını sağlamak.
                </p>
              </motion.div>
            </div>

            <div className="mb-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Değerlerimiz</h2>
                <p className="text-xl text-gray-600">
                  Bizi yönlendiren temel prensipler
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ValueCard
                  icon={<Shield className="w-6 h-6 text-emerald-600" />}
                  title="Güvenilirlik"
                  description="Hasta verilerinin güvenliği bizim önceliğimizdir. En yüksek güvenlik standartlarında çalışırız."
                  delay={0}
                />
                <ValueCard
                  icon={<Heart className="w-6 h-6 text-emerald-600" />}
                  title="Kullanıcı Odaklılık"
                  description="Her özelliğimizi kullanıcı deneyimini iyileştirmek için tasarlıyoruz."
                  delay={0.1}
                />
                <ValueCard
                  icon={<Zap className="w-6 h-6 text-emerald-600" />}
                  title="İnovasyon"
                  description="Sürekli gelişen teknolojilerle sektörün ihtiyaçlarına öncü çözümler sunuyoruz."
                  delay={0.2}
                />
                <ValueCard
                  icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                  title="Sürekli Gelişim"
                  description="Kullanıcı geri bildirimlerini dinleyerek ürünümüzü sürekli iyileştiriyoruz."
                  delay={0.3}
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center text-white"
            >
              <Users className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ekibimiz
              </h2>
              <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Teknoloji, sağlık ve tasarım alanında uzman profesyonellerden oluşan
                ekibimiz, sizin için en iyi deneyimi yaratmak için çalışıyor. Her gün
                daha iyi bir Cordelia için yenilikler üretiyoruz.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center space-x-4"
              >
                <Award className="w-8 h-8" />
                <span className="text-xl font-semibold">
                  Uzman, Tutkulu ve Kullanıcı Odaklı
                </span>
              </motion.div>
            </motion.div>
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
