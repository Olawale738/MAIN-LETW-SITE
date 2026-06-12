"""
Youth Program API
- Public:  list active programs + fetch a single program by slug
- Admin:   full CRUD + seed-defaults endpoint
- Auto-seeds 8 default programs the first time the list is fetched and the
  table is empty so the live /youth pages light up immediately.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.youth_program import YouthProgram
from schemas.youth_program import (
    YouthProgramResponse, YouthProgramCreate, YouthProgramUpdate,
)
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/youth/programs", tags=["youth-programs"])


# ─── Default seed ─────────────────────────────────────────────────────────────

DEFAULT_PROGRAMS = [
    {
        "slug": "youth-retreat-camp",
        "title": "Youth Retreat & Camp",
        "badge": "Annual Event",
        "icon": "Tent",
        "color_class": "bg-sky-100 text-sky-600",
        "hero_image_url": "/Impact.png",
        "short_description": "Three days of deep worship, prophetic encounters, and life-defining moments.",
        "long_description": "Every year we pull young people away from the noise and into the presence of God. Our annual retreat is three days of deep worship, prophetic encounters, outdoor fellowship, and life-defining moments. Many of our strongest testimonies were born in a camp setting — this could be yours.",
        "what_youll_do": [
            {"title": "Prophetic worship nights", "description": "Spirit-led worship that breaks chains, mends hearts, and births vision.", "icon": "Flame"},
            {"title": "Outdoor fellowship", "description": "Hikes, bonfires, and friendship-forging activities that take you out of your comfort zone.", "icon": "Tent"},
            {"title": "Life-direction sessions", "description": "Targeted teaching on identity, calling, and the next chapter of your story.", "icon": "Compass"},
            {"title": "Quiet-time mornings", "description": "Devotional space to journal, pray, and hear from God before the day begins.", "icon": "BookOpen"},
        ],
        "who_its_for": ["Ages 13–25", "Members & first-time visitors", "Anyone hungry for a fresh encounter"],
        "schedule": [
            {"day": "Day 1", "time": "Friday evening", "title": "Arrival + Opening Encounter", "description": "Check-in, dinner, worship, opening night message"},
            {"day": "Day 2", "time": "All day Saturday", "title": "Workshops + Bonfire", "description": "Sessions, fun, food, evening prayer & bonfire"},
            {"day": "Day 3", "time": "Sunday morning", "title": "Sunday Encounter Service", "description": "Final message, communion, commissioning, lunch, depart"},
        ],
        "outcomes": [
            "A renewed sense of God's voice in your life",
            "Friendships you'll keep for the rest of your walk",
            "Clarity on the next step of your journey",
        ],
        "leader_name": "",
        "leader_role": "Youth Director",
        "registration_open": True,
        "join_cta_text": "Reserve a Spot",
        "service_request_label": "Youth :: Retreat & Camp",
        "order_index": 1,
    },
    {
        "slug": "mentorship-circles",
        "title": "Mentorship Circles",
        "badge": "One-on-One",
        "icon": "Users",
        "color_class": "bg-violet-100 text-violet-600",
        "hero_image_url": "/Join.png",
        "short_description": "Get paired with a seasoned believer who's walked the road before you.",
        "long_description": "You don't have to figure life out alone. We pair young people with seasoned believers and industry professionals who have walked the road before you. Through monthly one-on-one sessions and small group circles, you gain wisdom, accountability, and real-world insight tailored to your season.",
        "what_youll_do": [
            {"title": "Monthly 1:1 with your mentor", "description": "Confidential, focused, you-set-the-agenda. Career, faith, relationships, decisions — bring what's real.", "icon": "MessageSquare"},
            {"title": "Quarterly circle meetups", "description": "Small group of mentees + mentors gather to share testimonies, scripture, and prayer requests.", "icon": "Users"},
            {"title": "Accountability check-ins", "description": "Weekly text or call rhythm so the goals you set don't fall off the radar.", "icon": "CheckCircle2"},
        ],
        "who_its_for": ["Ages 16–28", "Anyone seeking direction in faith, career, or relationships"],
        "schedule": [
            {"day": "Monthly", "time": "Member's choice", "title": "1:1 mentor session", "description": "Scheduled directly with your assigned mentor."},
            {"day": "Quarterly", "time": "Saturday 4 PM", "title": "Circle meetup", "description": "Whole cohort gathers — fellowship + structured discussion."},
        ],
        "outcomes": [
            "A trusted older voice in your corner",
            "Quarterly milestones you've actually hit",
            "A circle of peers walking the same direction",
        ],
        "registration_open": True,
        "join_cta_text": "Find a Mentor",
        "service_request_label": "Youth :: Mentorship Circles",
        "order_index": 2,
    },
    {
        "slug": "digital-missions",
        "title": "Digital Missions",
        "badge": "Tech-Powered",
        "icon": "Wifi",
        "color_class": "bg-cyan-100 text-cyan-600",
        "hero_image_url": "/EducationHero.jpg",
        "short_description": "Turn your phone into a pulpit. Reach thousands with the gospel through content.",
        "long_description": "The internet is the largest mission field in human history — and we are equipping young believers to occupy it. Learn content creation, storytelling, social media strategy, and online evangelism. Turn your phone into a pulpit and your platform into a ministry that reaches thousands.",
        "what_youll_do": [
            {"title": "Content creator bootcamps", "description": "Hands-on training in short-form video, photography, copywriting, and design — all gospel-focused.", "icon": "Video"},
            {"title": "Platform strategy sessions", "description": "Build a real audience and message strategy across Instagram, TikTok, YouTube, and Twitter.", "icon": "BarChart3"},
            {"title": "Live online outreaches", "description": "Coordinate weekly live streams, AMA nights, and prayer rooms that pull lost souls in.", "icon": "Globe"},
            {"title": "Faith + tech ethics", "description": "How to steward attention, protect your soul, and stay anchored while building online.", "icon": "ShieldCheck"},
        ],
        "who_its_for": ["Ages 14–30", "Creators, marketers, designers — believers who already live online"],
        "schedule": [
            {"day": "Wednesday", "time": "7 PM", "title": "Weekly cohort session", "description": "Hybrid: in-person + Zoom. New skill or topic each week."},
            {"day": "Saturday", "time": "10 AM", "title": "Creator lab", "description": "Production day — film, edit, design, post."},
        ],
        "outcomes": [
            "A repeatable content workflow you actually use",
            "A growing audience you can pastor",
            "Real conversions / testimonies from your platform",
        ],
        "registration_open": True,
        "join_cta_text": "Go Digital",
        "service_request_label": "Youth :: Digital Missions",
        "order_index": 3,
    },
    {
        "slug": "faith-and-fitness",
        "title": "Faith & Fitness",
        "badge": "Body & Spirit",
        "icon": "Dumbbell",
        "color_class": "bg-green-100 text-green-600",
        "hero_image_url": "/PrayerMeeting.png",
        "short_description": "Your body is the temple of the Holy Spirit. Train it. Honour Him.",
        "long_description": "Your body is the temple of the Holy Spirit — and we treat it that way. Our Faith & Fitness program combines weekly sport sessions, fitness challenges, and devotional discussions. Build physical discipline, forge friendships, and discover how taking care of your body honours God and sharpens your mind.",
        "what_youll_do": [
            {"title": "Weekly sport night", "description": "Football, basketball, volleyball — rotating based on cohort interest.", "icon": "Dumbbell"},
            {"title": "Devotional discussion", "description": "20-minute scripture + reflection on stewardship of the body before each session.", "icon": "BookOpen"},
            {"title": "30-day challenges", "description": "Quarterly fitness + spiritual disciplines that push you out of your comfort zone.", "icon": "Target"},
        ],
        "who_its_for": ["Ages 13–30", "All fitness levels — beginners genuinely welcome"],
        "schedule": [
            {"day": "Saturday", "time": "8:00 AM", "title": "Sport + devotion", "description": "Meet at the church field. 20 min devotion, 90 min play."},
        ],
        "outcomes": [
            "A stronger body that serves your calling",
            "A genuine theology of physical stewardship",
            "Brothers and sisters who'll show up for you",
        ],
        "registration_open": True,
        "join_cta_text": "Get Active",
        "service_request_label": "Youth :: Faith & Fitness",
        "order_index": 4,
    },
    {
        "slug": "drama-and-spoken-word",
        "title": "Drama & Spoken Word",
        "badge": "Creative Arts",
        "icon": "Mic2",
        "color_class": "bg-rose-100 text-rose-600",
        "hero_image_url": "/Discipleship.png",
        "short_description": "Drama, poetry, dance, visual storytelling — all as gospel proclamation.",
        "long_description": "Art is one of the most powerful ways to move a heart. This creative arts track trains youth in drama, spoken word poetry, dance, and visual storytelling — all as tools for Gospel proclamation. Perform at church events, community outreaches, and special services. Let your creativity carry the message.",
        "what_youll_do": [
            {"title": "Weekly workshops", "description": "Rotating focus: drama, spoken word, dance, song, visual arts.", "icon": "Mic2"},
            {"title": "Service performances", "description": "Take the stage at Sunday services, outreaches, and youth events.", "icon": "Music"},
            {"title": "Original works", "description": "Write, rehearse, produce — your own pieces, your voice, the gospel.", "icon": "PenLine"},
        ],
        "who_its_for": ["Ages 12–25", "Actors, poets, dancers, writers, designers — beginners and seasoned"],
        "schedule": [
            {"day": "Friday", "time": "6:30 PM", "title": "Workshop + rehearsal", "description": "Workshop the first hour, rehearse upcoming pieces the second."},
        ],
        "outcomes": [
            "A growing portfolio of pieces you've performed",
            "Confidence on stage and on camera",
            "A creative family that pushes you sharper",
        ],
        "registration_open": True,
        "join_cta_text": "Express Your Gift",
        "service_request_label": "Youth :: Drama & Spoken Word",
        "order_index": 5,
    },
    {
        "slug": "financial-stewardship",
        "title": "Financial Stewardship",
        "badge": "Kingdom Finance",
        "icon": "DollarSign",
        "color_class": "bg-emerald-100 text-emerald-600",
        "hero_image_url": "/Bible-study.png",
        "short_description": "Biblical money: budgeting, saving, investing, entrepreneurship — kingdom-first.",
        "long_description": "Nobody taught most of us how to handle money — and it shows in a generation drowning in debt. This program teaches biblical principles of stewardship, budgeting, saving, investing, and entrepreneurship. We raise young people who are not chasing money but commanding it for the Kingdom.",
        "what_youll_do": [
            {"title": "Money fundamentals series", "description": "Budgeting, saving, debt-freedom, emergency funds — the basics nobody taught.", "icon": "DollarSign"},
            {"title": "Investing 101", "description": "Stocks, real estate, retirement accounts — explained for beginners.", "icon": "BarChart3"},
            {"title": "Entrepreneurship lab", "description": "Validate, launch, and grow a small business or side hustle. Real coaching.", "icon": "Lightbulb"},
            {"title": "Giving with intent", "description": "Tithing, generosity, and using wealth as a kingdom instrument — not an idol.", "icon": "HandHeart"},
        ],
        "who_its_for": ["Ages 16–30", "Anyone tired of being financially stressed"],
        "schedule": [
            {"day": "Thursday", "time": "6:30 PM", "title": "Weekly cohort", "description": "8-week modules. Join at the start of any new module."},
        ],
        "outcomes": [
            "A working budget you actually follow",
            "A clear plan for debt, savings, and investing",
            "A biblical philosophy of money you can live by",
        ],
        "registration_open": True,
        "join_cta_text": "Build Wealth Wisely",
        "service_request_label": "Youth :: Financial Stewardship",
        "order_index": 6,
    },
    {
        "slug": "social-impact",
        "title": "Social Impact Projects",
        "badge": "Community Love",
        "icon": "HandHeart",
        "color_class": "bg-orange-100 text-orange-600",
        "hero_image_url": "/altersound.png",
        "short_description": "Youth-led outreach: feed, visit, clean, advocate. Faith outside four walls.",
        "long_description": "Faith without works is dead. Our youth-led social impact initiatives take the church outside its four walls — feeding the hungry, visiting the elderly, cleaning communities, and advocating for the vulnerable. These projects build compassion, character, and civic responsibility all at once.",
        "what_youll_do": [
            {"title": "Monthly outreach drive", "description": "Feeding the hungry, hospital visits, elder-care, community clean-ups.", "icon": "HandHeart"},
            {"title": "Project teams", "description": "Pick a cause, build a team, plan and execute your own initiative with coaching.", "icon": "Users"},
            {"title": "Advocacy training", "description": "How to speak up well for the vulnerable — biblically, wisely, effectively.", "icon": "Megaphone"},
        ],
        "who_its_for": ["Ages 12–30", "Anyone whose heart breaks for what breaks God's"],
        "schedule": [
            {"day": "First Saturday", "time": "9:00 AM", "title": "Outreach day", "description": "Meet at the church, deploy to the chosen community."},
        ],
        "outcomes": [
            "A track record of real service hours",
            "A project you led from idea to impact",
            "A heart shaped by the people you served",
        ],
        "registration_open": True,
        "join_cta_text": "Make an Impact",
        "service_request_label": "Youth :: Social Impact",
        "order_index": 7,
    },
    {
        "slug": "relationships-and-identity",
        "title": "Relationships & Identity",
        "badge": "Identity First",
        "icon": "ShieldCheck",
        "color_class": "bg-indigo-100 text-indigo-600",
        "hero_image_url": "/Counselling.png",
        "short_description": "Anchored identity. Healthy relationships. Biblical wholeness.",
        "long_description": "In a world that is constantly redefining who you should be and who you should love, we anchor young people in God's truth. This program tackles identity, self-worth, healthy relationships, biblical courtship, purity, and emotional wholeness — giving you a foundation nothing can shake.",
        "what_youll_do": [
            {"title": "Identity Series", "description": "Who God says you are — from scripture, not from culture.", "icon": "ShieldCheck"},
            {"title": "Healthy relationships", "description": "Friendship, family, romance — what the Bible actually teaches and how to live it.", "icon": "Heart"},
            {"title": "Biblical courtship", "description": "Practical, honest, no-shame teaching on dating, courtship, and marriage with intent.", "icon": "Heart"},
            {"title": "Emotional wholeness", "description": "Naming wounds, walking through healing, building resilience — with God and community.", "icon": "Sparkles"},
        ],
        "who_its_for": ["Ages 14–28", "Both single and dating welcome"],
        "schedule": [
            {"day": "Tuesday", "time": "6:30 PM", "title": "Identity Circle", "description": "Group teaching + small-group discussion."},
        ],
        "outcomes": [
            "An anchored sense of who you are in Christ",
            "Tools to navigate friendship, dating, and family well",
            "Emotional honesty + healing practices that stick",
        ],
        "registration_open": True,
        "join_cta_text": "Know Who You Are",
        "service_request_label": "Youth :: Relationships & Identity",
        "order_index": 8,
    },
]


async def _seed_if_empty(db: AsyncSession) -> int:
    """Seed default programs if the table is empty. Returns # inserted."""
    count = (await db.execute(select(func.count(YouthProgram.id)))).scalar() or 0
    if count > 0:
        return 0
    for entry in DEFAULT_PROGRAMS:
        db.add(YouthProgram(**entry))
    await db.commit()
    return len(DEFAULT_PROGRAMS)


# ─── Public endpoints ─────────────────────────────────────────────────────────

@router.get("", response_model=List[YouthProgramResponse])
async def list_programs(db: AsyncSession = Depends(get_db)):
    """List all active programs (auto-seeds defaults on first call)."""
    await _seed_if_empty(db)
    result = await db.execute(
        select(YouthProgram)
        .where(YouthProgram.is_active.is_(True))
        .order_by(YouthProgram.order_index, YouthProgram.title)
    )
    return list(result.scalars().all())


@router.get("/{slug}", response_model=YouthProgramResponse)
async def get_program(slug: str, db: AsyncSession = Depends(get_db)):
    await _seed_if_empty(db)
    result = await db.execute(select(YouthProgram).where(YouthProgram.slug == slug))
    program = result.scalar_one_or_none()
    if not program or not program.is_active:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[YouthProgramResponse])
async def admin_list_all(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Admin: list every program (including hidden / inactive)."""
    result = await db.execute(
        select(YouthProgram).order_by(YouthProgram.order_index, YouthProgram.title)
    )
    return list(result.scalars().all())


@router.post("/admin", response_model=YouthProgramResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_program(
    payload: YouthProgramCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    # Reject duplicate slug
    existing = await db.execute(select(YouthProgram).where(YouthProgram.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"slug '{payload.slug}' already exists")
    p = YouthProgram(**payload.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.put("/admin/{program_id}", response_model=YouthProgramResponse)
async def admin_update_program(
    program_id: str,
    payload: YouthProgramUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(YouthProgram).where(YouthProgram.id == program_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Program not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/admin/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_program(
    program_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(YouthProgram).where(YouthProgram.id == program_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Program not found")
    await db.delete(p)
    await db.commit()


@router.post("/admin/seed-defaults", response_model=dict)
async def admin_seed_defaults(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Manually trigger the default seed. Safe — only inserts if table is empty."""
    inserted = await _seed_if_empty(db)
    return {"inserted": inserted}
