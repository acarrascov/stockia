// src/config/plans.js
const PLANS = {
  basic: {
    name: "Básico",
    maxProducts: 200,
    maxOrdersPerMonth: 1,
    maxUsers: 2,
  },
  pro: {
    name: "Pro",
    maxProducts: 2000,
    maxOrdersPerMonth: 2000,
    maxUsers: 5,
  },
  full: {
    name: "Full",
    maxProducts: Infinity,
    maxOrdersPerMonth: Infinity,
    maxUsers: Infinity,
  },
};

function getPlan(planKey) {
  return PLANS[planKey] ?? PLANS.basic;
}

module.exports = { PLANS, getPlan };