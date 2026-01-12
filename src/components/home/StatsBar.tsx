"use client";

const stats = [
  { 
    label: "Oldest Member", 
    value: "350+", 
    description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." 
  },
  { 
    label: "Youth Retreats", 
    value: "98+", 
    description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." 
  },
  { 
    label: "Tech Workshops", 
    value: "148+", 
    description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." 
  },
  { 
    label: "Christmas Concert", 
    value: "58+", 
    description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." 
  },
];

export default function StatsBar() {
  return (
    <section className="relative overflow-hidden">
      {/* Orange stats container */}
      <div className="bg-[#140152] pt-12 pb-20 px-4 md:px-8 lg:px-16 rounded-br-[120px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-white space-y-3">
                {/* Stat Number */}
                <h3 className="text-5xl md:text-6xl font-bold">
                  {stat.value}
                </h3>
                
                {/* Stat Label */}
                <h4 className="text-lg font-bold">
                  {stat.label}
                </h4>
                
                {/* Description */}
                <p className="text-white/90 text-sm leading-relaxed">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}