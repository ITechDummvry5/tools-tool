/*
  Technical Report (Explained Simply):

  This code powers a website that helps students find scholarships easily. 
  - Shows a changing title at the top to keep the page lively.
  - Allows students to search scholarships by keyword, location, or course.
  - Displays results in cards with image, description, location, course, and apply link.
  - Exact course matches appear first, making search more relevant.
  - Loader animation shows while results are loading.
  - Reset button reloads the page to start a new search.
  - Bookmark system using star icons (saved in localStorage).
*/

// ====================== HEADER TITLE ROTATION ======================

const titles = ["ACADLINK", "ScholarshipFinder"];
const header = document.getElementById("header-title");

let index = 0;
const delay = 4000;

function rotateTitle() {
  header.style.opacity = 0;
  setTimeout(() => {
    index = (index + 1) % titles.length;
    header.textContent = titles[index];
    header.style.opacity = 1;
  }, 700);
}
setInterval(rotateTitle, delay);

// ====================== SCHOLARSHIP DATA ======================

const scholarships = [
  {
    title: "DOST Scholarship",
    description: "STEM scholarship for science and tech students pursuing senior high or college.",
    location: "Laguna",
    course: "STEM",
    link: "https://sei.dost.gov.ph",
    image: "core/assets/images/DOST.png",
    status: "CLOSED",
    deadline: "December 15, 2025"
  },
  {
    title: "CHED Scholarship",
    description: "Government-funded scholarship supporting students across all strands.",
    location: "Pampanga",
    course: "ALL STRAND",
    link: "https://ched.gov.ph",
    image: "core/assets/images/CHED.png",
    status: "OPEN",
    deadline: "June 10, 2026"
  },
  {
    title: "Megaworld Foundation Scholarship",
    description: "Supports graduating senior high students with financial aid for college.",
    location: "Metro Manila",
    course: "ABM",
    link: "https://www.megaworldfoundation.com",
    image: "core/assets/images/MEGA.png",
    status: "CLOSED",
    deadline: "November 30, 2025"
  },
  {
    title: "OWWA Scholarship",
    description: "Assistance for dependents of OFWs to pursue senior high or college programs.",
    location: "Cebu",
    course: "TVL",
    link: "https://owwa.gov.ph",
    image: "core/assets/images/OWWA.png",
    status: "OPEN",
    deadline: "May 25, 2026"
  },
  {
    title: "DepEd SHS Voucher Program",
    description: "Financial aid for incoming senior high school students across strands.",
    location: "Cagayan",
    course: "ALL STRAND",
    link: "https://www.deped.gov.ph",
    image: "core/assets/images/DEPED.png",
    status: "CLOSED",
    deadline: "October 20, 2025"
  },
  {
    title: "Tertiary Education Subsidy (TES)",
    description: "Government support for college students from low-income families.",
    location: "Iloilo",
    course: "ALL STRAND",
    link: "https://unifast.gov.ph",
    image: "core/assets/images/UNI.png",
    status: "OPEN",
    deadline: "July 5, 2026"
  },
  {
    title: "DSWD Educational Assistance",
    description: "Provides financial aid for students in need to continue their studies.",
    location: "Albay",
    course: "ALL STRAND",
    link: "https://www.dswd.gov.ph",
    image: "core/assets/images/DSWD.png",
    status: "CLOSED",
    deadline: "September 18, 2025"
  },
  {
    title: "AFP Educational Benefit System",
    description: "Scholarship program for dependents of AFP personnel in the Philippines.",
    location: "Davao del Sur",
    course: "ALL STRAND",
    link: "https://www.afp.mil.ph",
    image: "core/assets/images/AFP.png",
    status: "OPEN",
    deadline: "August 15, 2026"
  },
  {
    title: "PNP Educational Assistance Program",
    description: "Support for children of PNP members to pursue senior high or college education.",
    location: "Misamis Oriental",
    course: "ALL STRAND",
    link: "https://www.pnp.gov.ph",
    image: "core/assets/images/PNP.png",
    status: "CLOSED",
    deadline: "September 5, 2025"
  },
  {
    title: "CHED Merit Scholarship",
    description: "Merit-based scholarship for top-performing students across all strands.",
    location: "Ilocos Norte",
    course: "ALL STRAND",
    link: "https://ched.gov.ph",
    image: "core/assets/images/CHED.png",
    status: "OPEN",
    deadline: "July 20, 2026"
  },
  {
    title: "DILG Scholarship Program",
    description: "For students interested in public service careers, especially HUMSS strand.",
    location: "Leyte",
    course: "HUMSS",
    link: "https://www.dilg.gov.ph",
    image: "core/assets/images/DILG.png",
    status: "CLOSED",
    deadline: "October 12, 2025"
  },
  {
    title: "DOST-SEI JL Science Scholarship",
    description: "Science-focused scholarship supporting senior high students in STEM.",
    location: "Zamboanga del Sur",
    course: "STEM",
    link: "https://sei.dost.gov.ph",
    image: "core/assets/images/DOST.png",
    status: "OPEN",
    deadline: "June 28, 2026"
  },
  {
    title: "BFAR Scholarship",
    description: "For students pursuing fisheries, aquatic sciences, and marine studies.",
    location: "Palawan",
    course: "STEM",
    link: "https://www.bfar.da.gov.ph",
    image: "core/assets/images/BFAR.png",
    status: "CLOSED",
    deadline: "November 2, 2025"
  },
  {
    title: "TESDA Scholarship Program",
    description: "Technical-vocational training for students and out-of-school youth.",
    location: "South Cotabato",
    course: "TVL",
    link: "https://www.tesda.gov.ph",
    image: "core/assets/images/TESDA.png",
    status: "OPEN",
    deadline: "May 30, 2026"
  },
  {
    title: "SM Foundation Scholarship",
    description: "Financial assistance for college students with academic merit and need.",
    location: "Metro Manila",
    course: "ABM",
    link: "https://www.sm-foundation.org",
    image: "core/assets/images/SM.png",
    status: "CLOSED",
    deadline: "December 1, 2025"
  },
  {
    title: "Philippine National Oil Company (PNOC) Scholarship",
    description: "Provides financial assistance to students pursuing STEM or Engineering courses.",
    location: "Quezon",
    course: "STEM",
    link: "https://www.pnoc.com.ph",
    image: "core/assets/images/PNOC.png",
    status: "OPEN",
    deadline: "August 2, 2026"
  },
  {
    title: "San Miguel Foundation Scholarship",
    description: "Scholarship for senior high and college students in Business and ABM strand.",
    location: "Cebu",
    course: "ABM",
    link: "https://www.sanmiguelfoundation.org",
    image: "core/assets/images/SAN.png",
    status: "OPEN",
    deadline: "June 12, 2026"
  }
,
{ title: "Ayala Foundation Scholarship", description: "Supports students from low-income families pursuing college.", location: "Makati", course: "ALL STRAND", link: "https://www.ayalafoundation.org", image: "core/assets/images/AYALA.png", status: "OPEN", deadline: "June 30, 2026" },
  { title: "Aboitiz Scholarship", description: "Merit-based scholarship for business and engineering students.", location: "Cebu", course: "STEM", link: "https://aboitiz.com", image: "core/assets/images/ABOITIZ.png", status: "CLOSED", deadline: "November 15, 2025" },
  { title: "Manila Water Scholarship", description: "Scholarship for environmental and engineering students.", location: "Quezon City", course: "STEM", link: "https://manilawater.com", image: "core/assets/images/MW.png", status: "OPEN", deadline: "July 10, 2026" },
  { title: "PLDT Smart Foundation Scholarship", description: "ICT and tech-focused scholarship for senior high students.", location: "Taguig", course: "STEM", link: "https://pldtsmartfoundation.org", image: "core/assets/images/PLDT.png", status: "OPEN", deadline: "May 22, 2026" },
  { title: "Gokongwei Brothers Foundation Scholarship", description: "Supports business and engineering students.", location: "Pasig", course: "ABM", link: "https://gokongweibrothersfoundation.org", image: "core/assets/images/GBF.png", status: "CLOSED", deadline: "October 5, 2025" },

  { title: "Robinsons Retail Scholarship", description: "Financial aid for retail management students.", location: "Pasig", course: "ABM", link: "https://robinsonsretail.com", image: "core/assets/images/ROB.png", status: "OPEN", deadline: "June 18, 2026" },
  { title: "Jollibee Foundation Scholarship", description: "Supports hospitality and business courses.", location: "Pasig", course: "ABM", link: "https://www.jollibeefoundation.org", image: "core/assets/images/JFC.png", status: "CLOSED", deadline: "November 28, 2025" },
  { title: "Globe Telecom Scholarship", description: "For ICT and computer science students.", location: "Taguig", course: "STEM", link: "https://www.globe.com.ph", image: "core/assets/images/GLOBE.png", status: "OPEN", deadline: "August 1, 2026" },
  { title: "UnionBank Scholarship", description: "Scholarship for finance and IT students.", location: "Mandaluyong", course: "ABM", link: "https://www.unionbankph.com", image: "core/assets/images/UB.png", status: "OPEN", deadline: "July 25, 2026" },
  { title: "RCBC Scholarship", description: "For accounting and business students.", location: "Makati", course: "ABM", link: "https://www.rcbc.com", image: "core/assets/images/RCBC.png", status: "CLOSED", deadline: "September 30, 2025" },

  { title: "BDO Foundation Scholarship", description: "Supports finance and business students nationwide.", location: "Makati", course: "ABM", link: "https://www.bdo.com.ph", image: "core/assets/images/BDO.png", status: "OPEN", deadline: "June 8, 2026" },
  { title: "Landbank Scholarship", description: "Financial support for agriculture and business students.", location: "Manila", course: "ABM", link: "https://www.landbank.com", image: "core/assets/images/LANDBANK.png", status: "CLOSED", deadline: "October 25, 2025" },
  { title: "GSIS Scholarship", description: "Assistance for dependents of GSIS members.", location: "Pasay", course: "ALL STRAND", link: "https://www.gsis.gov.ph", image: "core/assets/images/GSIS.png", status: "OPEN", deadline: "May 14, 2026" },
  { title: "Pag-IBIG Scholarship", description: "Support for children of Pag-IBIG members.", location: "Mandaluyong", course: "ALL STRAND", link: "https://www.pagibigfund.gov.ph", image: "core/assets/images/PAGIBIG.png", status: "CLOSED", deadline: "September 12, 2025" },
  { title: "PhilHealth Scholarship", description: "Medical and health-related scholarship.", location: "Quezon City", course: "STEM", link: "https://www.philhealth.gov.ph", image: "core/assets/images/PHILHEALTH.png", status: "OPEN", deadline: "July 2, 2026" },

  { title: "PNB Scholarship", description: "Financial assistance for banking students.", location: "Manila", course: "ABM", link: "https://www.pnb.com.ph", image: "core/assets/images/PNB.png", status: "OPEN", deadline: "June 27, 2026" },
  { title: "Metrobank Foundation Scholarship", description: "Merit scholarship for college students.", location: "Makati", course: "ALL STRAND", link: "https://www.metrobankfoundation.org", image: "core/assets/images/METRO.png", status: "CLOSED", deadline: "October 10, 2025" },
  { title: "Security Bank Scholarship", description: "Supports finance and business majors.", location: "Makati", course: "ABM", link: "https://www.securitybank.com", image: "core/assets/images/SB.png", status: "OPEN", deadline: "August 6, 2026" },
  { title: "Toyota Motor PH Scholarship", description: "Engineering and automotive technology scholarship.", location: "Laguna", course: "STEM", link: "https://www.toyota.com.ph", image: "core/assets/images/TOYOTA.png", status: "CLOSED", deadline: "November 18, 2025" },
  { title: "Honda PH Scholarship", description: "Automotive and engineering scholarship.", location: "Batangas", course: "STEM", link: "https://www.hondaph.com", image: "core/assets/images/HONDA.png", status: "OPEN", deadline: "July 15, 2026" }

  // … continue pattern to reach 100 total
];

// ====================== RENDER FUNCTION ======================

function renderScholarships(list) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

  if (list.length === 0) {
    resultsDiv.innerHTML = `<h1 class="no-results">NO SCHOLARSHIPS FOUND</h1>`;
    return;
  }

  list.forEach(item => {
    const isBookmarked = savedBookmarks.includes(item.title);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="card-image">
      <h3>${item.title}</h3>
      <p>${item.description}</p>

      <div class="badges">
        <span class="badge"><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
        <span class="badge"><i class="fa-solid fa-graduation-cap"></i> ${item.course}</span>
      </div>

      <p class="deadline">
        <span class="badge status ${item.status === "OPEN" ? "open" : "closed"}">
          <i class="fa-solid fa-circle"></i> ${item.status}
        </span>
        <i class="fa-solid fa-calendar"></i> ${item.deadline}
      </p>

      <div class="link-row">
        <a href="${item.link}" target="_blank">Open link</a>
        <i class="fa-solid fa-star bookmark-star ${isBookmarked ? "active" : ""}" data-id="${item.title}"></i>
      </div>
    `;

    resultsDiv.appendChild(div);
  });
}

// ====================== SHOWBOOKMARK FROM THE START FUNCTION ======================

function showOnlyBookmarked() {
  const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

  const bookmarkedList = scholarships.filter(item =>
    savedBookmarks.includes(item.title)
  );

  renderScholarships(bookmarkedList);
}
// ====================== SEARCH FUNCTION ======================

function searchScholarships() {
  const loader = document.getElementById("loader");

  loader.classList.add("active");

  setTimeout(() => {
    const keyword = document.getElementById("search").value.toLowerCase().trim();
    const selectedLocation = document.getElementById("location").value.toLowerCase().trim();
    const selectedCourse = document.getElementById("course").value;

    const filtered = scholarships
      .filter(item => {
        const matchKeyword =
          keyword === "" ||
          item.title.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword);

        const matchLocation =
          selectedLocation === "" ||
          item.location.toLowerCase().includes(selectedLocation);

        const matchCourse =
          selectedCourse === "" ||
          item.course === selectedCourse ||
          item.course === "ALL STRAND";

        return matchKeyword && matchCourse && matchLocation;
      })
      .sort((a, b) => {
        if (selectedCourse === "") return 0;
        const aMatch = a.course === selectedCourse ? 1 : 0;
        const bMatch = b.course === selectedCourse ? 1 : 0;
        return bMatch - aMatch;
      });

    renderScholarships(filtered);
    loader.classList.remove("active");
  }, 2100);
}

// ====================== RESET FUNCTION ======================

function resetSearch() {
  location.reload();
}

// ====================== CLOCK FUNCTION ======================

function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  clock.textContent = `${hours}:${minutes}:${seconds}`;
}

updateClock();
setInterval(updateClock, 1000);

// ====================== BOOKMARK FUNCTION ======================

document.addEventListener("click", function(e) {
  if (e.target.classList.contains("bookmark-star")) {
    const id = e.target.dataset.id;
    let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    if (bookmarks.includes(id)) {
      bookmarks = bookmarks.filter(b => b !== id);
      e.target.classList.remove("active");
    } else {
      bookmarks.push(id);
      e.target.classList.add("active");
    }

    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }
});

// ====================== DEFAULT LOAD ======================

showOnlyBookmarked();
