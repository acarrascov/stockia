const { db } = require("../config/firebase");

class AuditService {
  constructor() {
    this.collection = db.collection("audit_logs");
  }

  async logAction(data) {
    try {
      await this.collection.add({
        ...data,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging audit action:", error);
      throw error;
    }
  }
}

module.exports = AuditService;