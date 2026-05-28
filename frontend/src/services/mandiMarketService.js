/**
 * frontend/services/mandiMarketService.js
 *
 * A tiny lookup table that maps Indian states (and the national average)
 * to the corresponding CommodityMarketLive iframe URLs.
 *
 * Why a service?  
 *   • Keeps your UI component lean – it only worries about rendering.  
 *   • Lets you reuse the same list anywhere else (e.g., a market‑overview page).  
 *   • Future‑proof: just add a `jsonUrl` if the provider ever opens a proper API.
 *
 *.
 */

export const MANDI_OPTIONS = {
  // ── National average ───────────────────────────────────────────────────────
  national: {
    label: "National Average",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecurrentnationalavg",
    // If a JSON endpoint ever appears, uncomment and point to it:
    // jsonUrl: "https://www.commoditymarketlive.com/mandi/api/nationalavg",
  },

  // ── States (alphabetical) ─────────────────────────────────────────────────
  andhra_pradesh: {
    label: "Andhra Pradesh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/andhra-pradesh",
  },
  arunachal_pradesh: {
    label: "Arunachal Pradesh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/arunachal-pradesh",
  },
  assam: {
    label: "Assam",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/assam",
  },
  bihar: {
    label: "Bihar",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/bihar",
  },
  chhattisgarh: {
    label: "Chhattisgarh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/chhattisgarh",
  },
  goa: {
    label: "Goa",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/goa",
  },
  gujarat: {
    label: "Gujarat",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/gujarat",
  },
  haryana: {
    label: "Haryana",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/haryana",
  },
  himachal_pradesh: {
    label: "Himachal Pradesh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/himachal-pradesh",
  },
  jharkhand: {
    label: "Jharkhand",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/jharkhand",
  },
  karnataka: {
    label: "Karnataka",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/karnataka",
  },
  kerala: {
    label: "Kerala",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/kerala",
  },
  madhya_pradesh: {
    label: "Madhya Pradesh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/madhya-pradesh",
  },
  maharashtra: {
    label: "Maharashtra",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/maharashtra",
  },
  manipur: {
    label: "Manipur",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/manipur",
  },
  meghalaya: {
    label: "Meghalaya",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/meghalaya",
  },
  mizoram: {
    label: "Mizoram",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/mizoram",
  },
  nagaland: {
    label: "Nagaland",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/nagaland",
  },
  odisha: {
    label: "Odisha",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/odisha",
  },
  punjab: {
    label: "Punjab",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/punjab",
  },
  rajasthan: {
    label: "Rajasthan",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/rajasthan",
  },
  sikkim: {
    label: "Sikkim",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/sikkim",
  },
  tamil_nadu: {
    label: "Tamil Nadu",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/tamil-nadu",
  },
  telangana: {
    label: "Telangana",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/telangana",
  },
  tripura: {
    label: "Tripura",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/tripura",
  },
  uttarakhand: {
    label: "Uttarakhand",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/uttarakhand",
  },
  uttar_pradesh: {
    label: "Uttar Pradesh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/uttar-pradesh",
  },
  west_bengal: {
    label: "West Bengal",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/west-bengal",
  },

  // ── Union Territories ───────────────────────────────────────────────────────
  andaman_and_nicobar: {
    label: "Andaman & Nicobar Islands",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/andaman-and-nicobar",
  },
  chandigarh: {
    label: "Chandigarh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/chandigarh",
  },
  dadra_and_nagar_haveli: {
    label: "Dadra & Nagar Haveli",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/dadra-and-nagar-haveli",
  },
  delhi: {
    label: "Delhi (NCT)",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/delhi",
  },
  jammu_and_kashmir: {
    label: "Jammu & Kashmir",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/jammu-and-kashmir",
  },
  ladakh: {
    label: "Ladakh",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/ladakh",
  },
  lakshadweep: {
    label: "Lakshadweep",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/lakshadweep",
  },
  puducherry: {
    label: "Puducherry",
    iframeUrl:
      "https://www.commoditymarketlive.com/mandi/framecommoditybystate/puducherry",
  },
};