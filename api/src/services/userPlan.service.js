// src/services/userPlan.service.js
const { db } = require("../config/firebase");
const { getPlan } = require("../config/plans");

async function getUserPlanByUid(uid) {
  const snap = await db.collection("users").doc(uid).get();
  const planKey = snap.exists ? snap.data()?.plan : null;
  return getPlan(planKey);
}

module.exports = { getUserPlanByUid };