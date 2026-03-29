with open("frontend/src/app/bible-reading/page.tsx", "r") as f:
    lines = f.readlines()

new_content = """            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-[2rem] border border-blue-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#140152] flex items-center justify-center text-2xl shadow-lg shadow-blue-900/20">
                    🏠
                  </div>
                  <h2 className="text-3xl font-black text-[#140152]">Homecell Fellowship</h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Designed to build strong believers through intimate worship, sound teaching, heartfelt prayer, and authentic Christian community in a warm environment.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: '🔥', title: 'Spirit-Led Worship', desc: 'Intimate worship inviting God\'s presence.' },
                    { icon: '📖', title: 'Word-Centered', desc: 'Practical teaching for victorious living.' },
                    { icon: '🤝', title: 'Interactive Discussion', desc: 'Open conversations & deeper insights.' },
                    { icon: '🙏', title: 'Targeted Prayer', desc: 'Focused intercession for specific needs.' },
                    { icon: '💬', title: 'Accountability', desc: 'Mentorship & spiritual maturity.' },
                    { icon: '❤️', title: 'Care & Support', desc: 'Sharing burdens & celebrating victories.' },
                    { icon: '🌍', title: 'Evangelism', desc: 'Mobilizing to reach our communities.' },
                  ].map((item, i) => (
                    <div key={i} className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                      <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                      <h3 className="font-bold text-[#140152] text-sm mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
"""

# Find start and end indices
try:
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if 'className="bg-blue-50 p-8 rounded-[2rem]"' in line:
            start_idx = i
        if 'className="mt-8"' in line: # reliable anchor near the end
             # Assuming the next couple of lines close the div
             end_idx = i + 3 # line with closing div for bg-blue-50
    
    if start_idx != -1 and end_idx != -1:
        # Verify the end index logic
        # line  has mt-8 div
        # line  bas content (button)
        # line  closes mt-8 div
        # line  closes bg-blue-50 div
        
        # Looking at previous view_file:
        # 244: <div className="mt-8">
        # 245:   <PremiumButton...
        # 246: </div>
        # 247: </div>
        
        # So end_idx should be i + 3. Correct.
        
        lines[start_idx:end_idx+1] = [new_content]
        
        with open("frontend/src/app/bible-reading/page.tsx", "w") as f:
            f.writelines(lines)
        print("Successfully updated file")
    else:
        print(f"Could not find start/end indices: {start_idx}, {end_idx}")

except Exception as e:
    print(f"Error: {e}")
