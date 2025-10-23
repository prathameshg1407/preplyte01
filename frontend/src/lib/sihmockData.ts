export const colleges = [
    {
      slug: 'iit-delhi',
      name: "Indian Institute of Technology Delhi",
      location: "Hauz Khas, New Delhi - 110016",
      nirfRank: 2,
      naacGrade: "A++",
      stats: [
        { label: "Established", value: "1961" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "11,000+" },
        { label: "Campus Size", value: "325 Acres" },
      ],
      courses: {
        btech: {
          duration: "4 Years",
          specializations: 16,
          examples: "Computer Science, Mechanical, Electrical, Civil",
        },
        mtech: {
          duration: "2 Years",
          specializations: 25,
          examples: "AI & ML, Data Science, Robotics",
        },
        phd: {
          duration: "3-6 Years",
          programs: "Research Programs",
          examples: "All Engineering Disciplines",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹50,000/year",
          eligibility: "Top 10% students eligible",
        },
        {
          title: "Need-based Aid",
          amount: "Full fee waiver",
          eligibility: "Family income < ₹1L/year",
        },
        {
          title: "SC/ST Scholarship",
          amount: "₹2,000/month",
          sponsor: "Government sponsored",
        },
      ],
      entranceExams: [
        {
          name: "JEE Advanced",
          for: "B.tech Admission",
          cutoff: "2,500 rank",
        },
        {
          name: "GATE",
          for: "M.tech Admission",
          cutoff: "750+ score",
        },
        {
          name: "JAM",
          for: "M.Sc Programs",
          cutoff: "450+ score",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹2,50,000",
          hostel: "₹25,000",
          total: "₹2,75,000",
        },
        mtech: {
          tuition: "₹25,000",
          hostel: "₹25,000",
          total: "₹75,000",
        },
        additional: {
          mess: "₹45,000/year",
          books: "₹15,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "95%",
          label: "Average Package: ₹18L",
        },
        facultyRatio: {
          value: "1:8",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "2,500+",
          label: "Published Annually",
        },
      },
      rank: 1,
      streams: ['Engineering', 'Technology'],
      fees: '₹2.5L - ₹10L per year',
      naac: 'A++',
    },
    {
      slug: 'aiims-delhi',
      name: 'AIIMS Delhi',
      location: 'New Delhi, Delhi',
      nirfRank: 1,
      naacGrade: "A++",
      stats: [
        { label: "Established", value: "1956" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "5,000+" },
        { label: "Campus Size", value: "200 Acres" },
      ],
      courses: {
        btech: {
          duration: "5.5 Years",
          specializations: 10,
          examples: "MBBS, Nursing",
        },
        mtech: {
          duration: "3 Years",
          specializations: 15,
          examples: "MD, MS, MDS",
        },
        phd: {
          duration: "3-5 Years",
          programs: "Research Programs",
          examples: "Medical Sciences",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹30,000/year",
          eligibility: "Top 5% students eligible",
        },
        {
          title: "Need-based Aid",
          amount: "Full fee waiver",
          eligibility: "Family income < ₹2L/year",
        },
        {
          title: "SC/ST Scholarship",
          amount: "₹1,500/month",
          sponsor: "Government sponsored",
        },
      ],
      entranceExams: [
        {
          name: "NEET",
          for: "MBBS Admission",
          cutoff: "100 rank",
        },
        {
          name: "AIIMS PG",
          for: "MD/MS Admission",
          cutoff: "500+ score",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹1,000",
          hostel: "₹5,000",
          total: "₹6,000",
        },
        mtech: {
          tuition: "₹700",
          hostel: "₹5,000",
          total: "₹5,700",
        },
        additional: {
          mess: "₹30,000/year",
          books: "₹10,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "100%",
          label: "Average Package: ₹12L",
        },
        facultyRatio: {
          value: "1:5",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "3,000+",
          label: "Published Annually",
        },
      },
      rank: 1,
      streams: ['Medical', 'Healthcare'],
      fees: '₹5.8K - ₹1.5L per year',
      naac: 'A++',
    },
    // Add similar mock data for other colleges...
    {
      slug: 'iim-ahmedabad',
      name: 'IIM Ahmedabad',
      location: 'Ahmedabad, Gujarat',
      nirfRank: 1,
      naacGrade: "A++",
      stats: [
        { label: "Established", value: "1961" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "1,000+" },
        { label: "Campus Size", value: "102 Acres" },
      ],
      courses: {
        btech: {
          duration: "2 Years",
          specializations: 5,
          examples: "MBA, PGP",
        },
        mtech: {
          duration: "1 Year",
          specializations: 3,
          examples: "Executive MBA",
        },
        phd: {
          duration: "4-5 Years",
          programs: "Research Programs",
          examples: "Management",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹1,00,000/year",
          eligibility: "Top performers",
        },
        {
          title: "Need-based Aid",
          amount: "Partial waiver",
          eligibility: "Low income",
        },
      ],
      entranceExams: [
        {
          name: "CAT",
          for: "MBA Admission",
          cutoff: "99 percentile",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹25,00,000",
          hostel: "₹2,00,000",
          total: "₹27,00,000",
        },
        mtech: {
          tuition: "₹20,00,000",
          hostel: "₹1,50,000",
          total: "₹21,50,000",
        },
        additional: {
          mess: "₹1,00,000/year",
          books: "₹50,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "100%",
          label: "Average Package: ₹30L",
        },
        facultyRatio: {
          value: "1:10",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "500+",
          label: "Published Annually",
        },
      },
      rank: 1,
      streams: ['Management', 'Business'],
      fees: '₹25L - ₹30L per year',
      naac: 'A++',
    },
    // Repeat for Miranda House, IIT Bombay, St. Stephen's College with similar structures, inventing data as needed.
    {
      slug: 'miranda-house',
      name: 'Miranda House',
      location: 'New Delhi, Delhi',
      nirfRank: 1,
      naacGrade: "A++",
      stats: [
        { label: "Established", value: "1948" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "4,000+" },
        { label: "Campus Size", value: "20 Acres" },
      ],
      courses: {
        btech: {
          duration: "3 Years",
          specializations: 20,
          examples: "BA, BSc",
        },
        mtech: {
          duration: "2 Years",
          specializations: 10,
          examples: "MA, MSc",
        },
        phd: {
          duration: "3-5 Years",
          programs: "Research Programs",
          examples: "Arts & Sciences",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹20,000/year",
          eligibility: "High scorers",
        },
        {
          title: "Need-based Aid",
          amount: "Fee concession",
          eligibility: "Economically weak",
        },
      ],
      entranceExams: [
        {
          name: "DUET",
          for: "Admission",
          cutoff: "95%",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹15,000",
          hostel: "₹20,000",
          total: "₹35,000",
        },
        mtech: {
          tuition: "₹20,000",
          hostel: "₹20,000",
          total: "₹40,000",
        },
        additional: {
          mess: "₹25,000/year",
          books: "₹5,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "85%",
          label: "Average Package: ₹8L",
        },
        facultyRatio: {
          value: "1:15",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "300+",
          label: "Published Annually",
        },
      },
      rank: 1,
      streams: ['Arts', 'Science'],
      fees: '₹15K - ₹50K per year',
      naac: 'A++',
    },
    {
      slug: 'iit-bombay',
      name: 'IIT Bombay',
      location: 'Mumbai, Maharashtra',
      nirfRank: 3,
      naacGrade: "A++",
      stats: [
        { label: "Established", value: "1958" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "10,000+" },
        { label: "Campus Size", value: "550 Acres" },
      ],
      courses: {
        btech: {
          duration: "4 Years",
          specializations: 15,
          examples: "Aerospace, Chemical, Computer Science",
        },
        mtech: {
          duration: "2 Years",
          specializations: 20,
          examples: "Biotech, Environmental",
        },
        phd: {
          duration: "3-6 Years",
          programs: "Research Programs",
          examples: "Engineering",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹40,000/year",
          eligibility: "Top ranks",
        },
        {
          title: "Need-based Aid",
          amount: "Full waiver",
          eligibility: "Low income",
        },
      ],
      entranceExams: [
        {
          name: "JEE Advanced",
          for: "B.Tech",
          cutoff: "1,000 rank",
        },
        {
          name: "GATE",
          for: "M.Tech",
          cutoff: "700 score",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹2,00,000",
          hostel: "₹20,000",
          total: "₹2,20,000",
        },
        mtech: {
          tuition: "₹50,000",
          hostel: "₹20,000",
          total: "₹70,000",
        },
        additional: {
          mess: "₹40,000/year",
          books: "₹10,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "96%",
          label: "Average Package: ₹20L",
        },
        facultyRatio: {
          value: "1:9",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "2,000+",
          label: "Published Annually",
        },
      },
      rank: 2,
      streams: ['Engineering', 'Technology'],
      fees: '₹2L - ₹8L per year',
      naac: 'A++',
    },
    {
      slug: 'st-stephens-college',
      name: "St. Stephen's College",
      location: 'New Delhi, Delhi',
      nirfRank: 2,
      naacGrade: "A+",
      stats: [
        { label: "Established", value: "1881" },
        { label: "University Type", value: "Public" },
        { label: "Students", value: "1,500+" },
        { label: "Campus Size", value: "69 Acres" },
      ],
      courses: {
        btech: {
          duration: "3 Years",
          specializations: 12,
          examples: "Economics, History, Physics",
        },
        mtech: {
          duration: "2 Years",
          specializations: 8,
          examples: "Maths, Chemistry",
        },
        phd: {
          duration: "3-5 Years",
          programs: "Research Programs",
          examples: "Humanities",
        },
      },
      scholarships: [
        {
          title: "Merit Scholarship",
          amount: "Up to ₹25,000/year",
          eligibility: "Merit based",
        },
        {
          title: "Need-based Aid",
          amount: "Concession",
          eligibility: "Financial need",
        },
      ],
      entranceExams: [
        {
          name: "CUET",
          for: "Admission",
          cutoff: "98%",
        },
      ],
      feeStructure: {
        btech: {
          tuition: "₹40,000",
          hostel: "₹30,000",
          total: "₹70,000",
        },
        mtech: {
          tuition: "₹50,000",
          hostel: "₹30,000",
          total: "₹80,000",
        },
        additional: {
          mess: "₹35,000/year",
          books: "₹8,000/year",
        },
      },
      additionalDetails: {
        placementRate: {
          value: "90%",
          label: "Average Package: ₹10L",
        },
        facultyRatio: {
          value: "1:12",
          label: "Student to Faculty",
        },
        researchPapers: {
          value: "400+",
          label: "Published Annually",
        },
      },
      rank: 2,
      streams: ['Arts', 'Science'],
      fees: '₹40K - ₹60K per year',
      naac: 'A+',
    },
  ];