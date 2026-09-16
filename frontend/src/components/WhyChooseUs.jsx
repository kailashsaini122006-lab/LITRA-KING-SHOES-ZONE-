import { Truck, ShieldCheck, Lock, PackageCheck, MapPin } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    {
      icon: Truck,
      title: '🚚 Home Delivery',
      desc: 'Fast doorstep delivery to your location with real-time distance calculation.',
      glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      icon: ShieldCheck,
      title: '💵 Cash on Delivery',
      desc: 'Pay conveniently with Cash on Delivery (COD) or UPI when your shoes arrive.',
      glowColor: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      icon: Lock,
      title: '🔒 Secure Checkout',
      desc: '100% safe checkout with verified order processing and instant order ID.',
      glowColor: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      icon: PackageCheck,
      title: '📦 Order Tracking',
      desc: 'Track your footwear shipment status live using your Order ID or phone number.',
      glowColor: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    {
      icon: MapPin,
      title: '📍 LITRA KING, Chomu',
      desc: 'Trusted local footwear store in Chomu, Rajasthan serving retail and wholesale.',
      glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Why Shop With Us
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Why Choose <span className="gold-text-gradient">LITRA KING</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            We prioritize customer satisfaction, superior footwear comfort, and genuine wholesale rates.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className={`bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${item.glowColor} group`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${item.iconBg} group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <h3 className="text-white font-extrabold text-xl mb-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
