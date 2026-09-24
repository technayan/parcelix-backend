-- CreateIndex
CREATE INDEX "couriers_availabilityStatus_verificationStatus_idx" ON "couriers"("availabilityStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "hubs_zoneId_status_idx" ON "hubs"("zoneId", "status");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_bkashTrxId_idx" ON "payments"("bkashTrxId");

-- CreateIndex
CREATE INDEX "pricings_insideDhaka_idx" ON "pricings"("insideDhaka");

-- CreateIndex
CREATE INDEX "shipments_customerId_status_createdAt_idx" ON "shipments"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "shipments_courierId_status_createdAt_idx" ON "shipments"("courierId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "shipments_courierId_createdAt_idx" ON "shipments"("courierId", "createdAt");

-- CreateIndex
CREATE INDEX "shipments_status_createdAt_idx" ON "shipments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "trackingShipments_shipmentId_createdAt_idx" ON "trackingShipments"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "users_role_status_createdAt_idx" ON "users"("role", "status", "createdAt");
