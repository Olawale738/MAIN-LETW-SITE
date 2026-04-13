'use client'

import { useState, useEffect, useMemo } from 'react'
import ServicePageLayout from '@/components/shared/ServicePageLayout'
import { Check, Flame, BookOpen, ChevronDown, ChevronUp, Star, Trophy, Quote } from 'lucide-react'
import { bibleReadingApi, bibleStudyApi, QuarterlyTheme, WeekReflection } from '@/lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WeekContent {
  verse: string
  ref: string
  reflection: string
}

// ─── Quarter definitions ────────────────────────────────────────────────────────
const QUARTERS = [
  {
    id: 1,
    title: 'Origins & The King',
    theme: 'The Cost of Discipleship',
    scripture: 'Luke 14:27–35',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    weeks: [1, 13],
  },
  {
    id: 2,
    title: 'Redemption & Ministry',
    theme: 'Fruitfulness Through Christ',
    scripture: 'John 15:16',
    accent: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
    weeks: [14, 27],
  },
  {
    id: 3,
    title: 'Law & the Spirit',
    theme: 'The Sustaining Power of the Holy Spirit',
    scripture: 'Acts 1:8',
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    weeks: [28, 40],
  },
  {
    id: 4,
    title: 'Covenant & the Church',
    theme: 'Enter into His Rest',
    scripture: 'Hebrews 11:24–26',
    accent: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    weeks: [41, 54],
  },
]

// ─── Key content per week ───────────────────────────────────────────────────────
const WEEK_CONTENT: Record<number, WeekContent> = {
  1: {
    verse: 'In the beginning God created the heavens and the earth.',
    ref: 'Genesis 1:1',
    reflection:
      'You are beginning your greatest journey. The God who spoke the universe into existence invites you into His story. What does it mean that He is the origin of all things — including you?',
  },
  7: {
    verse:
      '"I am the LORD who brought you out of Ur of the Chaldeans to give you this land."',
    ref: 'Genesis 15:7',
    reflection:
      "God calls and then confirms. Abraham left without seeing the destination. What promise are you holding onto that hasn't fully materialized yet?",
  },
  13: {
    verse: '"You intended to harm me, but God intended it for good."',
    ref: 'Genesis 50:20',
    reflection:
      "Joseph's story closes with one of the most powerful declarations in Scripture. What story of betrayal in your own life might God be redeeming for a greater good?",
  },
  14: {
    verse: '"I AM WHO I AM."',
    ref: 'Exodus 3:14',
    reflection:
      'Moses asked for a name. God gave an identity. He is the self-existent, eternal God. How does this name — I AM — change the way you pray?',
  },
  23: {
    verse: '"Be holy because I, the LORD your God, am holy."',
    ref: 'Leviticus 19:2',
    reflection:
      "Holiness is not restriction — it is an invitation. God is calling you into His nature, not just His rules. What would your week look like if you filtered every decision through 'is this holy?'",
  },
  27: {
    verse: '"The LORD bless you and keep you; the LORD make his face shine on you."',
    ref: 'Numbers 6:24–25',
    reflection:
      'Even in the middle of the wilderness census of Numbers, God pauses to bless His people. Let this priestly blessing rest on you today.',
  },
  28: {
    verse:
      '"Very truly I tell you, whoever believes in me will do the works I have been doing."',
    ref: 'John 14:12',
    reflection:
      "The Gospel of John is the Gospel of belief. As you enter Q3, ask yourself: what does it truly mean to believe? Not just agree — but trust, obey, and depend?",
  },
  33: {
    verse: '"You will receive power when the Holy Spirit comes on you."',
    ref: 'Acts 1:8',
    reflection:
      'The book of Acts is the story of the Spirit-empowered church. You are not reading history — you are reading your inheritance. Are you living in the power described here?',
  },
  40: {
    verse: '"Love the LORD your God with all your heart."',
    ref: 'Deuteronomy 6:5',
    reflection:
      "Deuteronomy is Moses\u2019 final sermon — the whole law compressed into love. Jesus called this the greatest commandment. Is love the filter through which you obey?",
  },
  41: {
    verse: '"Be strong and courageous. Do not be afraid; do not be discouraged."',
    ref: 'Joshua 1:9',
    reflection:
      'You are entering Q4 — the home stretch. Joshua crossed over into the promised land. What "crossing over" is God calling you to make in this final quarter?',
  },
  48: {
    verse:
      '"If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong."',
    ref: '1 Corinthians 13:1',
    reflection:
      "Paul\u2019s famous love chapter interrupts a letter about spiritual gifts. Why? Because gifts without love are noise. What spiritual activity in your life needs more love behind it?",
  },
  54: {
    verse: '"To him who is able to keep you from stumbling... be glory, majesty, power and authority."',
    ref: 'Jude 1:24–25',
    reflection:
      'You made it. 54 weeks of Scripture. You have walked from Genesis to the New Testament epistles. The God who started this journey in you will complete it. Give Him glory today.',
  },
}

// ─── Fallback reflection by OT book ────────────────────────────────────────────
function getWeekContent(week: number, oldTestament: string): WeekContent {
  if (WEEK_CONTENT[week]) return WEEK_CONTENT[week]

  if (oldTestament.startsWith('Genesis'))
    return {
      verse: 'So God created mankind in his own image, in the image of God he created them.',
      ref: 'Genesis 1:27',
      reflection:
        'You are reading your origin story. You were not an accident — you were crafted by a Creator who stamped His own image onto you. How does that truth change the way you see yourself today?',
    }
  if (oldTestament.startsWith('Exodus'))
    return {
      verse: 'The LORD will fight for you; you need only to be still.',
      ref: 'Exodus 14:14',
      reflection:
        'The God of Exodus is the Great Deliverer — He has not changed. What battle are you carrying that He is asking you to lay down and let Him fight?',
    }
  if (oldTestament.startsWith('Leviticus'))
    return {
      verse: 'For the life of a creature is in the blood.',
      ref: 'Leviticus 17:11',
      reflection:
        'Leviticus is the book of atonement. Every sacrifice points forward to the cross. As you read each ritual, ask: how is this pointing me to Jesus?',
    }
  if (oldTestament.startsWith('Numbers'))
    return {
      verse: 'The LORD is slow to anger, abounding in love.',
      ref: 'Numbers 14:18',
      reflection:
        'Israel complained in the wilderness — and God was patient. Where in your own journey are you complaining instead of trusting? Let His patience soften you.',
    }
  if (oldTestament.startsWith('Deuteronomy'))
    return {
      verse: 'Remember how the LORD your God led you all the way in the wilderness.',
      ref: 'Deuteronomy 8:2',
      reflection:
        'Deuteronomy calls Israel to remember. Memory is a spiritual discipline. Take a moment to remember how God has led you — even through your own wildernesses.',
    }
  if (oldTestament.startsWith('Joshua'))
    return {
      verse: 'Every place that the sole of your foot will tread upon I have given to you.',
      ref: 'Joshua 1:3',
      reflection:
        'Joshua is a book of possession — stepping into what God has already promised. What promise of God are you not yet walking in? This week, take a step.',
    }

  return {
    verse: 'Your word is a lamp for my feet, a light on my path.',
    ref: 'Psalm 119:105',
    reflection:
      'The Word you are reading this week is not ancient history — it is a living lamp. Ask God: what specific truth is He illuminating for you in this passage today?',
  }
}

// ─── Full reading plan ──────────────────────────────────────────────────────────
const READING_PLAN = [
  { week: 1, oldTestament: 'Genesis 1–3', newTestament: 'Matthew 1–2' },
  { week: 2, oldTestament: 'Genesis 4–7', newTestament: 'Matthew 3–4' },
  { week: 3, oldTestament: 'Genesis 8–11', newTestament: 'Matthew 5–7' },
  { week: 4, oldTestament: 'Genesis 12–15', newTestament: 'Matthew 8–10' },
  { week: 5, oldTestament: 'Genesis 16–19', newTestament: 'Matthew 11–13' },
  { week: 6, oldTestament: 'Genesis 20–23', newTestament: 'Matthew 14–16' },
  { week: 7, oldTestament: 'Genesis 24–27', newTestament: 'Matthew 17–19' },
  { week: 8, oldTestament: 'Genesis 28–31', newTestament: 'Matthew 20–22' },
  { week: 9, oldTestament: 'Genesis 32–35', newTestament: 'Matthew 23–25' },
  { week: 10, oldTestament: 'Genesis 36–39', newTestament: 'Matthew 26–28' },
  { week: 11, oldTestament: 'Genesis 40–43', newTestament: 'Mark 1–3' },
  { week: 12, oldTestament: 'Genesis 44–47', newTestament: 'Mark 4–6' },
  { week: 13, oldTestament: 'Genesis 48–50', newTestament: 'Mark 7–9' },
  { week: 14, oldTestament: 'Exodus 1–4', newTestament: 'Mark 10–12' },
  { week: 15, oldTestament: 'Exodus 5–8', newTestament: 'Mark 13–16' },
  { week: 16, oldTestament: 'Exodus 9–12', newTestament: 'Luke 1–3' },
  { week: 17, oldTestament: 'Exodus 13–16', newTestament: 'Luke 4–6' },
  { week: 18, oldTestament: 'Exodus 17–20', newTestament: 'Luke 7–9' },
  { week: 19, oldTestament: 'Exodus 21–24', newTestament: 'Luke 10–12' },
  { week: 20, oldTestament: 'Exodus 25–28', newTestament: 'Luke 13–15' },
  { week: 21, oldTestament: 'Exodus 29–32', newTestament: 'Luke 16–18' },
  { week: 22, oldTestament: 'Exodus 33–36', newTestament: 'Luke 19–21' },
  { week: 23, oldTestament: 'Exodus 37–40', newTestament: 'Luke 22–24' },
  { week: 24, oldTestament: 'Leviticus 1–4', newTestament: 'John 1–3' },
  { week: 25, oldTestament: 'Leviticus 5–8', newTestament: 'John 4–6' },
  { week: 26, oldTestament: 'Leviticus 9–12', newTestament: 'John 7–9' },
  { week: 27, oldTestament: 'Leviticus 13–16', newTestament: 'John 10–12' },
  { week: 28, oldTestament: 'Leviticus 17–20', newTestament: 'John 13–15' },
  { week: 29, oldTestament: 'Leviticus 21–24', newTestament: 'John 16–18' },
  { week: 30, oldTestament: 'Leviticus 25–27', newTestament: 'John 19–21' },
  { week: 31, oldTestament: 'Numbers 1–4', newTestament: 'Acts 1–3' },
  { week: 32, oldTestament: 'Numbers 5–8', newTestament: 'Acts 4–6' },
  { week: 33, oldTestament: 'Numbers 9–12', newTestament: 'Acts 7–9' },
  { week: 34, oldTestament: 'Numbers 13–16', newTestament: 'Acts 10–12' },
  { week: 35, oldTestament: 'Numbers 17–20', newTestament: 'Acts 13–15' },
  { week: 36, oldTestament: 'Numbers 21–24', newTestament: 'Acts 16–18' },
  { week: 37, oldTestament: 'Numbers 25–28', newTestament: 'Acts 19–21' },
  { week: 38, oldTestament: 'Numbers 29–32', newTestament: 'Acts 22–24' },
  { week: 39, oldTestament: 'Numbers 33–36', newTestament: 'Acts 25–28' },
  { week: 40, oldTestament: 'Deuteronomy 1–4', newTestament: 'Romans 1–3' },
  { week: 41, oldTestament: 'Deuteronomy 5–8', newTestament: 'Romans 4–6' },
  { week: 42, oldTestament: 'Deuteronomy 9–12', newTestament: 'Romans 7–9' },
  { week: 43, oldTestament: 'Deuteronomy 13–16', newTestament: 'Romans 10–12' },
  { week: 44, oldTestament: 'Deuteronomy 17–20', newTestament: 'Romans 13–16' },
  { week: 45, oldTestament: 'Deuteronomy 21–24', newTestament: '1 Corinthians 1–4' },
  { week: 46, oldTestament: 'Deuteronomy 25–28', newTestament: '1 Corinthians 5–8' },
  { week: 47, oldTestament: 'Deuteronomy 29–32', newTestament: '1 Corinthians 9–12' },
  { week: 48, oldTestament: 'Deuteronomy 33–34, Joshua 1–2', newTestament: '1 Corinthians 13–16' },
  { week: 49, oldTestament: 'Joshua 3–6', newTestament: '2 Corinthians 1–4' },
  { week: 50, oldTestament: 'Joshua 7–10', newTestament: '2 Corinthians 5–8' },
  { week: 51, oldTestament: 'Joshua 11–14', newTestament: '2 Corinthians 9–13' },
  { week: 52, oldTestament: 'Joshua 15–18', newTestament: 'Galatians 1–3' },
  { week: 53, oldTestament: 'Joshua 19–22', newTestament: 'Galatians 4–6' },
  { week: 54, oldTestament: 'Joshua 23–24, Judges 1–2', newTestament: 'Ephesians 1–6' },
]

const TOTAL_WEEKS = READING_PLAN.length

function getQuarterForWeek(week: number) {
  return QUARTERS.find((q) => week >= q.weeks[0] && week <= q.weeks[1]) ?? QUARTERS[0]
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-sm border"
      style={{ borderColor: color + '40' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-xl font-black text-[#140152] leading-none">{value}</div>
        <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function ThisWeekHero({
  weekData,
  content,
  quarter,
  isCompleted,
  onToggle,
  registered,
  onRegister,
}: {
  weekData: (typeof READING_PLAN)[0]
  content: WeekContent
  quarter: (typeof QUARTERS)[0]
  isCompleted: boolean
  onToggle: () => void
  registered: boolean
  onRegister: () => void
}) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #140152 0%, #1a0270 40%, ${quarter.accent}cc 100%)`,
      }}
    >
      {/* Decorative orbs */}
      <div
        className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: quarter.accent }}
      />
      <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none bg-[#f5bb00]" />

      <div className="relative z-10 p-8 md:p-12">
        {/* Quarter badge */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: quarter.accent + '30', color: '#f5bb00', border: `1px solid ${quarter.accent}60` }}
          >
            Quarter {quarter.id} · {quarter.title}
          </span>
          <span className="text-white/40 text-xs font-medium">{quarter.scripture}</span>
        </div>

        {/* Week label */}
        <div className="text-white/50 text-sm font-semibold uppercase tracking-widest mb-2">
          {isCompleted ? '✓ This Week — Completed' : 'This Week — Your Reading'}
        </div>

        {/* Passages */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2">Old Testament</div>
            <div className="text-white text-2xl font-black">{weekData.oldTestament}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2">New Testament</div>
            <div className="text-white text-2xl font-black">{weekData.newTestament}</div>
          </div>
        </div>

        {/* Key verse */}
        <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 relative">
          <Quote className="absolute top-4 left-4 w-6 h-6 text-[#f5bb00]/30" />
          <p className="text-white/90 text-lg leading-relaxed font-light italic pl-6 mb-3">
            "{content.verse}"
          </p>
          <p className="text-[#f5bb00] text-sm font-bold pl-6">— {content.ref}</p>
        </div>

        {/* Reflection */}
        <div className="bg-black/20 rounded-2xl p-5 mb-8">
          <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Star className="w-3.5 h-3.5" />
            Reflect on This
          </div>
          <p className="text-white/75 leading-relaxed text-sm">{content.reflection}</p>
        </div>

        {/* CTA */}
        {!registered ? (
          <button
            onClick={onRegister}
            className="w-full md:w-auto bg-[#f5bb00] text-[#140152] font-black text-base px-8 py-4 rounded-2xl hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
          >
            Begin My Journey →
          </button>
        ) : (
          <button
            onClick={onToggle}
            className={`w-full md:w-auto font-black text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] flex items-center gap-3 ${
              isCompleted
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-[#f5bb00] text-[#140152] hover:bg-yellow-400'
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-5 h-5" />
                Mark as Unread
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Mark Week {weekData.week} as Read
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function WeekCard({
  entry,
  isCompleted,
  isCurrent,
  quarterAccent,
  registered,
  onToggle,
}: {
  entry: (typeof READING_PLAN)[0]
  isCompleted: boolean
  isCurrent: boolean
  quarterAccent: string
  registered: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`relative rounded-2xl p-4 border transition-all duration-300 group ${
        isCompleted
          ? 'bg-emerald-50 border-emerald-200'
          : isCurrent
          ? 'bg-white border-[#f5bb00] shadow-lg'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
      style={isCurrent ? { boxShadow: '0 0 0 2px #f5bb00, 0 8px 24px rgba(245,187,0,0.15)' } : {}}
    >
      {/* Current pulse dot */}
      {isCurrent && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5bb00] opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f5bb00]" />
        </span>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div
            className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
              isCompleted ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            Week {entry.week}
          </div>
          {isCurrent && (
            <span className="text-[10px] font-bold text-[#f5bb00] bg-[#f5bb00]/10 px-2 py-0.5 rounded-full">
              Start here →
            </span>
          )}
        </div>
        {registered && (
          <button
            onClick={onToggle}
            aria-label={isCompleted ? 'Mark as unread' : 'Mark as read'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            style={!isCompleted ? { '--hover-border': quarterAccent } as React.CSSProperties : {}}
          >
            {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-xs text-gray-500 flex items-start gap-1.5">
          <span className="font-semibold text-gray-400 shrink-0">OT</span>
          <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-gray-700'}`}>
            {entry.oldTestament}
          </span>
        </div>
        <div className="text-xs text-gray-500 flex items-start gap-1.5">
          <span className="font-semibold text-gray-400 shrink-0">NT</span>
          <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-gray-700'}`}>
            {entry.newTestament}
          </span>
        </div>
      </div>
    </div>
  )
}

function QuarterSection({
  quarter,
  weeks,
  completed,
  currentWeek,
  registered,
  onToggle,
}: {
  quarter: (typeof QUARTERS)[0]
  weeks: (typeof READING_PLAN)
  completed: Record<number, boolean>
  currentWeek: number
  registered: boolean
  onToggle: (week: number) => void
}) {
  const completedInQuarter = weeks.filter((w) => completed[w.week]).length
  const totalInQuarter = weeks.length
  const pct = Math.round((completedInQuarter / totalInQuarter) * 100)
  const isFinished = completedInQuarter === totalInQuarter
  const [open, setOpen] = useState(() => {
    // auto-open the quarter that contains the current week
    return weeks.some((w) => w.week === currentWeek)
  })

  return (
    <div
      className="rounded-3xl overflow-hidden border"
      style={{ borderColor: quarter.border }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left transition-colors hover:opacity-90"
        style={{ background: quarter.bg }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
            style={{ background: quarter.accent }}
          >
            Q{quarter.id}
          </div>
          <div>
            <div className="font-black text-[#140152] text-lg leading-tight">{quarter.title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{quarter.theme}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mini progress */}
          <div className="hidden md:flex items-center gap-3">
            {isFinished && (
              <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Complete!
              </span>
            )}
            <div className="w-24 bg-white rounded-full h-2 overflow-hidden border border-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: quarter.accent }}
              />
            </div>
            <span className="text-sm font-bold text-gray-500 w-20 text-right">
              {completedInQuarter}/{totalInQuarter} weeks
            </span>
          </div>
          {open ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Scripture tag */}
      {open && (
        <div
          className="px-6 py-3 text-xs font-semibold flex items-center gap-2"
          style={{ background: quarter.accent + '12', color: quarter.accent }}
        >
          <span className="italic">Theme: "{quarter.theme}"</span>
          <span className="opacity-60">·</span>
          <span>{quarter.scripture}</span>
        </div>
      )}

      {/* Week cards */}
      {open && (
        <div className="p-6 bg-[#fafafa]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {weeks.map((entry) => (
              <WeekCard
                key={entry.week}
                entry={entry}
                isCompleted={!!completed[entry.week]}
                isCurrent={entry.week === currentWeek}
                quarterAccent={quarter.accent}
                registered={registered}
                onToggle={() => onToggle(entry.week)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function BibleReadingPage() {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [registered, setRegistered] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Dynamic content from admin ──────────────────────────────────────────────
  const [adminThemes, setAdminThemes] = useState<QuarterlyTheme[]>([])
  const [adminReflections, setAdminReflections] = useState<WeekReflection[]>([])

  // Merge admin quarterly themes over hardcoded QUARTERS
  const activeQuarters = useMemo(() => {
    if (adminThemes.length === 0) return QUARTERS
    return QUARTERS.map(q => {
      const admin = adminThemes.find(t => t.quarter_number === q.id)
      if (!admin) return q
      return {
        ...q,
        title: admin.title,
        theme: admin.theme,
        scripture: admin.scripture,
        accent: admin.accent_color,
        weeks: [admin.week_start, admin.week_end] as [number, number],
      }
    })
  }, [adminThemes])

  // Merge admin week reflections over WEEK_CONTENT
  const activeWeekContent = useMemo((): Record<number, WeekContent> => {
    const base = { ...WEEK_CONTENT }
    for (const r of adminReflections) {
      base[r.week_number] = { verse: r.key_verse, ref: r.verse_ref, reflection: r.reflection }
    }
    return base
  }, [adminReflections])

  // ── Load progress + admin content from backend ──────────────────────────────
  useEffect(() => {
    // Seed UI instantly from cache so it doesn't flash empty
    const cachedCompleted = localStorage.getItem('bibleReadingCompleted')
    const cachedRegistered = localStorage.getItem('bibleReadingRegistered')
    if (cachedCompleted) setCompleted(JSON.parse(cachedCompleted))
    if (cachedRegistered) setRegistered(true)

    // Fetch admin-authored themes & reflections (public endpoints, no auth needed)
    Promise.all([
      bibleStudyApi.getQuarterlyThemes().catch(() => []),
      bibleStudyApi.getWeekReflections().catch(() => []),
    ]).then(([themes, reflections]) => {
      if (themes.length > 0) setAdminThemes(themes)
      if (reflections.length > 0) setAdminReflections(reflections)
    })

    // Then sync progress with backend (overwrites cache on success)
    bibleReadingApi.getProgress()
      .then((data) => {
        // Convert string keys to number keys
        const numericCompleted: Record<number, boolean> = {}
        for (const [k, v] of Object.entries(data.completed_weeks)) {
          numericCompleted[Number(k)] = v
        }
        setCompleted(numericCompleted)
        if (data.registered) setRegistered(true)
        // Sync cache
        localStorage.setItem('bibleReadingCompleted', JSON.stringify(numericCompleted))
        if (data.registered) localStorage.setItem('bibleReadingRegistered', 'true')
      })
      .catch(() => {
        // Backend unreachable — localStorage cache already loaded above, no-op
      })
  }, [])

  // ── Toggle week completion ────────────────────────────────────────────────────
  const toggleComplete = async (week: number) => {
    // Optimistic update
    const prev = !!completed[week]
    const next = { ...completed, [week]: !prev }
    setCompleted(next)
    localStorage.setItem('bibleReadingCompleted', JSON.stringify(next))

    try {
      setSaving(true)
      const result = await bibleReadingApi.toggleWeek(week)
      // Reconcile with server truth (in case of race conditions)
      const reconciled = { ...next, [week]: result.completed }
      setCompleted(reconciled)
      localStorage.setItem('bibleReadingCompleted', JSON.stringify(reconciled))
    } catch {
      // Revert optimistic update on failure
      setCompleted({ ...completed })
      localStorage.setItem('bibleReadingCompleted', JSON.stringify(completed))
    } finally {
      setSaving(false)
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setRegistered(true)
    localStorage.setItem('bibleReadingRegistered', 'true')
    try {
      await bibleReadingApi.register()
    } catch {
      // Registration saved locally; will sync on next login
    }
  }

  // Derived stats
  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed]
  )
  const progressPct = Math.round((completedCount / TOTAL_WEEKS) * 100)

  // Current week = first uncompleted week (or last if all done)
  const currentWeek = useMemo(() => {
    if (completedCount === TOTAL_WEEKS) return TOTAL_WEEKS
    for (const entry of READING_PLAN) {
      if (!completed[entry.week]) return entry.week
    }
    return 1
  }, [completed, completedCount])

  // Streak: count consecutive completed weeks from week 1
  const streak = useMemo(() => {
    let s = 0
    for (const entry of READING_PLAN) {
      if (completed[entry.week]) s++
      else break
    }
    return s
  }, [completed])

  const currentWeekData = READING_PLAN.find((e) => e.week === currentWeek) ?? READING_PLAN[0]
  const currentQuarter = getQuarterForWeek(currentWeek)
  const currentContent = activeWeekContent[currentWeek] ?? getWeekContent(currentWeek, currentWeekData.oldTestament)
  const currentQuarterNum = currentQuarter.id

  // Group weeks by quarter
  const weeksByQuarter = useMemo(() => {
    return activeQuarters.map((q) => ({
      quarter: q,
      weeks: READING_PLAN.filter((e) => e.week >= q.weeks[0] && e.week <= q.weeks[1]),
    }))
  }, [activeQuarters])

  return (
    <ServicePageLayout serviceName="Bible study" brandTitle="Bible Reading" brandColor="#f5bb00">
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #fdfaf3 0%, #f9f6ee 100%)',
        }}
      >
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 pt-24 md:pt-10 space-y-8">

          {/* ── Page title ── */}
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f5bb00]">
              2026 · 54 Weeks Through Scripture
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-[#140152] mt-1 leading-tight">
              Your Bible Reading<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#140152] to-[#7c3aed]">
                Journey
              </span>
            </h1>
            <p className="text-gray-500 mt-3 max-w-xl leading-relaxed">
              A year-long walk through Scripture — Old Testament and New Testament, side by side.
              Not a task. A conversation with God.
            </p>
          </div>

          {/* ── Stats row ── */}
          {registered && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill
                icon={<Flame className="w-4 h-4" />}
                label="Week Streak"
                value={streak > 0 ? `${streak} 🔥` : '—'}
                color="#d97706"
              />
              <StatPill
                icon={<Check className="w-4 h-4" />}
                label="Weeks Completed"
                value={`${completedCount} / ${TOTAL_WEEKS}`}
                color="#059669"
              />
              <StatPill
                icon={<BookOpen className="w-4 h-4" />}
                label="Overall Progress"
                value={`${progressPct}%`}
                color="#140152"
              />
              <StatPill
                icon={<Trophy className="w-4 h-4" />}
                label="Current Quarter"
                value={`Q${currentQuarterNum}`}
                color={currentQuarter.accent}
              />
            </div>
          )}

          {/* ── Progress bar (always shown) ── */}
          {registered && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 font-medium mb-2">
                <span>Journey Progress</span>
                <span>{completedCount} of {TOTAL_WEEKS} weeks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #140152, #7c3aed)',
                  }}
                />
              </div>
              {/* Quarter markers */}
              <div className="flex justify-between mt-2">
                {activeQuarters.map((q) => (
                  <div key={q.id} className="flex flex-col items-center">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          completedCount >= q.weeks[1] ? q.accent : '#e5e7eb',
                      }}
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5">Q{q.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── This Week Hero ── */}
          <ThisWeekHero
            weekData={currentWeekData}
            content={currentContent}
            quarter={currentQuarter}
            isCompleted={!!completed[currentWeek]}
            onToggle={() => toggleComplete(currentWeek)}
            registered={registered}
            onRegister={handleRegister}
          />

          {/* ── All Quarters ── */}
          <div>
            <h2 className="text-2xl font-black text-[#140152] mb-6">
              The Full Journey
            </h2>
            <div className="space-y-4">
              {weeksByQuarter.map(({ quarter, weeks }) => (
                <QuarterSection
                  key={quarter.id}
                  quarter={quarter}
                  weeks={weeks}
                  completed={completed}
                  currentWeek={currentWeek}
                  registered={registered}
                  onToggle={toggleComplete}
                />
              ))}
            </div>
          </div>

          {/* ── Completion celebration ── */}
          {registered && completedCount === TOTAL_WEEKS && (
            <div className="text-center py-16 bg-gradient-to-br from-[#140152] to-[#7c3aed] rounded-3xl text-white relative overflow-hidden">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-3xl font-black mb-3">You've read the Bible!</h3>
              <p className="text-white/70 max-w-sm mx-auto leading-relaxed">
                54 weeks. From Genesis to the Epistles. You have walked through the greatest story
                ever told. Start again — it never gets old.
              </p>
            </div>
          )}

          {/* ── Footer tip ── */}
          <div className="text-center py-6 text-sm text-gray-400">
            "Your word is a lamp for my feet, a light on my path." — Psalm 119:105
          </div>
        </main>
      </div>
    </ServicePageLayout>
  )
}