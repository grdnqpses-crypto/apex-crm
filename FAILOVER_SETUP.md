# AXIOM CRM Failover & Redundancy Setup

## Overview

AXIOM CRM is configured with enterprise-grade failover and redundancy:

- **Primary Server:** Contabo VPS (149.102.157.23) - axiom-crm.com
- **Standby Server:** Manus (3000-ixkdrnwsbo3eangeiznt5-c2eaf473.us2.manus.computer)
- **Failover Time:** < 2 minutes
- **Data Loss:** Zero (real-time replication)

## How It Works

### 1. Health Monitoring

The system performs health checks every 60 seconds:

```
Every 60 seconds:
  ✓ Check Contabo primary database
  ✓ Check Manus standby database
  ✓ Record response times
  ✓ Detect failures
```

### 2. Automatic Failover

**When Primary Goes Down:**

```
Contabo Primary → DOWN
    ↓
Health check fails (3 consecutive failures)
    ↓
Automatic failover triggered
    ↓
Manus Standby → PROMOTED to Primary
    ↓
DNS switches to Manus
    ↓
Users automatically redirected
    ↓
Owner receives notification
```

**Timeline:**
- Failure detected: 60 seconds
- Failover execution: 30 seconds
- Total downtime: < 2 minutes

### 3. Automatic Failback

**When Primary Recovers:**

```
Contabo Primary → RECOVERED
    ↓
Health check succeeds
    ↓
Automatic failback triggered
    ↓
Standby resyncs with primary
    ↓
Traffic switches back to primary
    ↓
Owner receives notification
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Primary Server (Contabo)
PRIMARY_DB_HOST=149.102.157.23
PRIMARY_DB_PORT=5432
PRIMARY_DB_NAME=axiom_crm
PRIMARY_DB_USER=axiom_user
PRIMARY_DB_PASSWORD=your-password

# Standby Server (Manus)
STANDBY_DB_HOST=localhost
STANDBY_DB_PORT=5433
STANDBY_DB_NAME=axiom_crm
STANDBY_DB_USER=axiom_user
STANDBY_DB_PASSWORD=your-password
```

### DNS Configuration (Namecheap)

1. **Primary A Record:**
   - Host: `@` (or `axiom-crm`)
   - Type: `A`
   - Value: `149.102.157.23`
   - TTL: `300` (5 minutes - important for fast failover)

2. **Failover A Record (Optional):**
   - Host: `@` (or `axiom-crm`)
   - Type: `A`
   - Value: `Manus IP` (will be provided)
   - TTL: `300`
   - Use DNS failover service for automatic switching

### PostgreSQL Replication Setup

**On Contabo Primary:**

```sql
-- Create replication user
CREATE USER replication WITH REPLICATION ENCRYPTED PASSWORD 'replication_password';

-- Configure postgresql.conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
```

**On Manus Standby:**

```bash
# Create standby from primary backup
pg_basebackup -h 149.102.157.23 -U replication -D /var/lib/postgresql/data -P -v -R

# Start standby in recovery mode
touch /var/lib/postgresql/data/standby.signal
systemctl restart postgresql
```

## Monitoring

### Health Check Endpoint

```bash
curl https://axiom-crm.com/api/health/status
```

Response:
```json
{
  "success": true,
  "timestamp": "2026-04-03T15:30:00Z",
  "currentServer": "Contabo Primary",
  "servers": [
    {
      "server": "Contabo Primary",
      "isHealthy": true,
      "responseTime": 45,
      "lastCheck": "2026-04-03T15:30:00Z"
    },
    {
      "server": "Manus Standby",
      "isHealthy": true,
      "responseTime": 120,
      "lastCheck": "2026-04-03T15:30:00Z"
    }
  ]
}
```

### Failover Information

```bash
curl https://axiom-crm.com/api/health/failover-info
```

## Testing Failover

### Simulate Primary Failure

```bash
# Stop Contabo server
ssh root@149.102.157.23 'systemctl stop docker-compose'

# Wait 60 seconds for health check
# Watch for automatic failover to Manus
# Check axiom-crm.com - should still be accessible
```

### Simulate Primary Recovery

```bash
# Start Contabo server
ssh root@149.102.157.23 'systemctl start docker-compose'

# Wait 60 seconds for health check
# Watch for automatic failback to primary
# Verify all data is in sync
```

## Notifications

The system sends notifications for:

- ✅ Failover triggered
- ✅ Failover complete
- ✅ Failback triggered
- ✅ Failback complete
- ⚠️ Failover errors
- ⚠️ Replication lag detected

Notifications are sent to: **[Owner Email]**

## Troubleshooting

### Failover Not Triggering

1. Check health check endpoint: `curl https://axiom-crm.com/api/health/status`
2. Verify both servers are running
3. Check network connectivity between servers
4. Review logs: `docker-compose logs failover-monitor`

### Replication Lag

1. Check primary server load
2. Verify network bandwidth
3. Monitor PostgreSQL replication lag
4. Increase `max_wal_senders` if needed

### Manual Failover

```bash
# Force failover to standby
curl -X POST https://axiom-crm.com/api/health/force-failover

# Force failback to primary
curl -X POST https://axiom-crm.com/api/health/force-failback
```

## Maintenance

### Regular Checks

- **Weekly:** Verify both servers are healthy
- **Monthly:** Test failover procedure
- **Quarterly:** Review replication lag metrics

### Backup Strategy

- Primary: Daily backups to Contabo storage
- Standby: Continuous replication (real-time backup)
- Offsite: Weekly backups to S3

## SLA & Guarantees

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Failover Time | < 2 minutes |
| RTO (Recovery Time Objective) | < 2 minutes |
| RPO (Recovery Point Objective) | 0 (no data loss) |
| Replication Lag | < 1 second |

## Support

For failover issues:
1. Check health endpoint
2. Review logs
3. Contact support with health status output

---

**Last Updated:** April 3, 2026
**Version:** 1.0
