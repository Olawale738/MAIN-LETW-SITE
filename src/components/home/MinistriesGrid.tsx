"use client";

import { ArrowRight } from "lucide-react";

const worshipServices = [
  {
    title: "Children's Worship",
    description: "Fun, faith-filled worship for kids ages 4-12.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
  },
  {
    title: "Sunday School Worship",
    description: "Learning and worship for all ages.",
    image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Children's Worship",
    description: "Fun, faith-filled worship for kids ages 4-12.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
  },
];

export default function WorshipSchedule() {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Main Image */}
          <div className="relative">
            {/* Main church image card */}
            <div className="relative bg-white rounded-3xl rounded-br-[120px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop"
                alt="Church Interior"
                className="w-full h-[500px] object-cover"
              />
              
              {/* Overlay card at bottom */}
              <div className="absolute bottom-8 left-8 bg-white rounded-2xl rounded-br-[50px] p-6 shadow-xl max-w-xs">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Youth Worship
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Engaging teens in faith, fellowship, growth.
                </p>
                <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-orange-500 font-semibold tracking-wider text-xs uppercase">
              <div className="w-2 h-2 rotate-45 bg-orange-500" />
              Worship With Us
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Join Us On Sunday At{" "}
              <span className="text-orange-500">8:00 & 9:00 AM</span>
            </h2>

            {/* Worship Services List */}
            <div className="space-y-4">
              {worshipServices.map((service, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl rounded-br-[40px] overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Service Image */}
                    <div className="w-40 h-24 rounded-xl rounded-br-[30px] overflow-hidden flex-shrink-0">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Service Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {service.description}
                      </p>
                    </div>

                    {/* Arrow Button */}
                    <button className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors flex-shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}