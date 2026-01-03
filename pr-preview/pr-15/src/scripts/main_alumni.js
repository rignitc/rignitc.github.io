/* ===============================
   HEADER ANIMATION
================================ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

const header = document.querySelector("#people .people-header");
if (header) observer.observe(header);

/* ===============================
   INFINITE SLIDERS
================================ */

const DUPLICATE_COUNT = 4;
const ALT_TEXT = "Alumni logo";

/* COMPANY LOGOS */ 
const companyImages = [
  "assets/images/companies/aws.webp",
  "assets/images/companies/Broadcom.webp",
  "assets/images/companies/caterpillar.webp",
  "assets/images/companies/dell.webp",
  "assets/images/companies/dxc.webp",
  "assets/images/companies/grafito.webp",
  "assets/images/companies/intel.webp",
  "assets/images/companies/isro.webp",
  "assets/images/companies/kbr.webp",
  "assets/images/companies/nawe.webp",
  "assets/images/companies/ns.webp",
  "assets/images/companies/nvidia.webp",
  "assets/images/companies/qualcomm.webp",
  "assets/images/companies/samsung.webp",
  "assets/images/companies/ti.webp",
  "assets/images/companies/uidai.webp",
  "assets/images/companies/bosh.webp",
  "assets/images/companies/oracle.webp",
  "assets/images/companies/ibm.webp",
  "assets/images/companies/microsoft.webp",
  "assets/images/companies/sandisk.webp",
  "assets/images/companies/tesla.webp"

  

];

/* UNIVERSITY LOGOS */
const universityImages = [
  "assets/images/companies/Aalto.png",
  "assets/images/companies/bits.webp",
  "assets/images/companies/Delft.png",
  "assets/images/companies/IIMB.webp",
  "assets/images/companies/IISc.png",
  "assets/images/companies/IITM.svg",
  "assets/images/companies/ku.webp",
  "assets/images/companies/Northeastern.png",
  "assets/images/companies/OSU.webp",
  "assets/images/companies/purdue.webp",
  "assets/images/companies/qut.png",
  "assets/images/companies/RWTH.svg",
  "assets/images/companies/sit.webp",
  "assets/images/companies/Teesside-University.webp",
  "assets/images/companies/texas.webp",
  "assets/images/companies/uc-san-diego.webp",
  "assets/images/companies/ucdavis.webp",
  "assets/images/companies/wisconsin-madison.png",
  "assets/images/companies/wpi.webp",
  "assets/images/companies/IITK.webp",
  "assets/images/companies/IIMA.webp",
  "assets/images/companies/ETH.webp"
];

function fillSlider(sliderId, images) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;

  for (let i = 0; i < DUPLICATE_COUNT; i++) {
    images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = ALT_TEXT;
      img.loading = "lazy";
      slider.appendChild(img);
    });
  }
}

/* INIT SLIDERS */
fillSlider("companySlider", companyImages);
fillSlider("universitySlider", universityImages);

/* ===============================
   STARTUPS (UNCHANGED)
================================ */

const startupGrid = document.getElementById("startupGrid");
if (startupGrid) {
  const startups = [
    {
      src: "assets/images/startups/nawe.webp",
      link: "https://www.nmotion.in/",
      name: "NAWE ROBOTICS"
    },
    {
      src: "assets/images/startups/grafito.webp",
      link: "https://www.grafito.in/",
      name: "GRAFITO INNOVATIONS"
    }
  ];

  startups.forEach(startup => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "10px";

    const a = document.createElement("a");
    a.href = startup.link;
    a.target = "_blank";

    const img = document.createElement("img");
    img.src = startup.src;
    img.alt = startup.name;

    a.appendChild(img);

    const caption = document.createElement("div");
    caption.textContent = startup.name;
    caption.style.color = "white";
    caption.style.fontSize = "1rem";
    caption.style.textAlign = "center";

    wrapper.appendChild(a);
    wrapper.appendChild(caption);
    startupGrid.appendChild(wrapper);
  });
}
