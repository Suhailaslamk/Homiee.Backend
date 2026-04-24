import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Truck } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent pt-16">
      <section className="relative overflow-hidden px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-[#e8c9ba] bg-[#fff3ea] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#b85c38]">
                Home Business Platform
              </div>
              <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-stone-900 md:text-7xl">
                Grow local brands,
                <span className="block text-[#b85c38]">shop from home.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
                Homiee is built for home businesses, neighborhood sellers, loyal customers, and delivery partners who keep local commerce moving.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button onClick={() => navigate('/login')} className="rounded-2xl bg-[#3f5143] px-8 py-4 font-bold text-white transition hover:bg-[#334237] hover:shadow-xl">
                  Enter Homiee
                </button>
                <button onClick={() => navigate('/signup/seller')} className="rounded-2xl border border-[#d9b7a6] bg-[#fffaf2] px-8 py-4 font-bold text-stone-900 transition hover:bg-[#f7ecdf]">
                  Start Selling
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <HeroPanel title="Homemade goods" subtitle="Showcase products with a storefront that feels personal." tone="bg-[#fff3ea]" />
              <HeroPanel title="Trusted local sellers" subtitle="Give small businesses a digital home that still feels warm and human." tone="bg-[#eef3eb]" />
              <HeroPanel title="Delivery that fits" subtitle="Connect nearby orders with flexible delivery partners." tone="bg-[#f6efe6]" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-[36px] border border-stone-200 bg-[#fffaf2] px-8 py-14 shadow-sm">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-stone-900">Choose Your Journey</h2>
            <p className="mt-3 text-stone-500">Homiee supports every side of local, home-first commerce.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard
              title="Home Sellers"
              desc="List your products, manage orders, and grow your business with a workspace made for small merchants."
              icon={<Store size={32} />}
              color="text-[#b85c38]"
              accent="group-hover:text-[#b85c38]"
              onClick={() => navigate('/signup/seller')}
            />
            <FeatureCard
              title="Customers"
              desc="Discover quality products from trusted home businesses and track every order in one place."
              icon={<User size={32} />}
              color="text-[#3f5143]"
              accent="group-hover:text-[#3f5143]"
              onClick={() => navigate('/signup/customer')}
            />
            <FeatureCard
              title="Delivery Partners"
              desc="Pick up flexible routes and support neighborhood sellers with fast, personal delivery."
              icon={<Truck size={32} />}
              color="text-[#8c5a2b]"
              accent="group-hover:text-[#8c5a2b]"
              onClick={() => navigate('/signup/delivery')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroPanel({ title, subtitle, tone }) {
  return (
    <div className={`rounded-[28px] border border-white/60 p-6 shadow-sm ${tone}`}>
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">Homiee</div>
      <h3 className="mt-3 text-2xl font-black text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{subtitle}</p>
    </div>
  );
}

const FeatureCard = ({ title, desc, icon, color, accent, onClick }) => (
  <div onClick={onClick} className="group cursor-pointer rounded-3xl border border-stone-200 bg-white p-10 transition-all hover:-translate-y-2 hover:shadow-2xl">
    <div className={`${color} mb-6 transition-transform group-hover:scale-110`}>{icon}</div>
    <h3 className="mb-3 text-2xl font-bold text-stone-900">{title}</h3>
    <p className="mb-6 text-stone-500">{desc}</p>
    <span className={`text-sm font-bold uppercase tracking-widest text-stone-400 ${accent}`}>Join now →</span>
  </div>
);
