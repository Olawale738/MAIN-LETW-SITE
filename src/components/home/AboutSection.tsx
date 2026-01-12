"use client";

import { ArrowRight, Heart, TrendingUp, Users, Building } from "lucide-react";

const features = [
  { icon: Heart, text: "Share God's Love", color: "bg-red-50 text-[#a57b00]" },
  { icon: TrendingUp, text: "Foster Spiritual Growth", color: "bg-orange-50 text-[#a57b00]" },
  { icon: Users, text: "Serve Our Community", color: "bg-rose-50 text-[#fabb00]" },
  { icon: Building, text: "Build Strong Relationships", color: "bg-amber-50 text-[#fabb00]" },
];

export default function AboutSection() {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Collage - Left Side */}
          <div className="relative h-[500px] lg:h-[600px]">
            {/* Main large image with curved top-left */}
            <div className="absolute top-0 right-0 w-[65%] h-[75%] overflow-hidden shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-amber-900 to-amber-700 rounded-tl-[100px]">
                <img
                  src="https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop"
                  alt="Church Interior"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>

            {/* Bottom left image with curved bottom-right */}
            <div className="absolute bottom-0 left-0 w-[55%] h-[60%] overflow-hidden shadow-xl z-10">
              <div className="w-full h-full bg-white rounded-br-[80px]">
                <img
                  src="https://images.unsplash.com/photo-1444333523264-70d30fe99923?q=80&w=2071&auto=format&fit=crop"
                  alt="Church Altar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Small decorative image - top left */}
            <div className="absolute top-4 left-0 w-[35%] h-[25%] overflow-hidden shadow-lg rounded-tl-[40px] rounded-br-[40px]">
              <img
                src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
                alt="Church Ceiling"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content - Right Side */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[#fabb00] font-semibold tracking-wider text-s uppercase">
              <div className="w-2 h-2 rotate-45 bg-orange-500" />
              About Us
            </div>

            {/* Heading */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Faith, Hope, and Love in{" "}
              <span className="text-[#a57b00]">Action Every Day</span>
            </h2>

            {/* Description Paragraphs */}
            <div className="space-y-4">
              <p className="text-gray-600 text-base leading-relaxed">
                We are a vibrant community of believers dedicated to worship, fellowship, and service. 
                Our mission is to share God's love, grow in faith, and make a positive impact in the 
                world through compassionate outreach and meaningful connections.
              </p>
              
              <p className="text-gray-600 text-base leading-relaxed">
                Our church is a welcoming place where everyone can find support, inspiration, and a 
                sense of belonging. Together, we strive to live out our faith and make a difference.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg ${feature.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Button */}
            <div className="pt-4">
              <button className="inline-flex items-center gap-2 bg-[#a57b00] hover:bg-[#fabb00] text-white font-semibold px-1 py-1 pl-5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group">
                Read More About Us
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#a57b00] -rotate-45 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}