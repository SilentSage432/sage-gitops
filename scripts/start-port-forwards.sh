#!/bin/bash
# SAGE Federation - Persistent Port Forwards
# This script keeps port-forwards alive with auto-restart

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill any existing port-forwards
echo -e "${YELLOW}🧹 Cleaning up existing port-forwards...${NC}"
pkill -f "port-forward.*3000" || true
pkill -f "port-forward.*3100" || true
sleep 2

# Function to start port-forward with auto-restart
start_port_forward() {
    local service=$1
    local port=$2
    local namespace=$3
    local name=$4
    
    echo -e "${BLUE}🚀 Starting $name port-forward...${NC}"
    
    while true; do
        echo -e "${GREEN}📡 $name: kubectl port-forward $service $port:$port${NC}"
        kubectl -n "$namespace" port-forward "$service" "$port:$port" 2>/dev/null || {
            echo -e "${RED}❌ $name port-forward failed, restarting in 5s...${NC}"
            sleep 5
            continue
        }
        echo -e "${YELLOW}⚠️  $name port-forward stopped, restarting...${NC}"
        sleep 2
    done &
}

# Start Grafana port-forward
start_port_forward "svc/grafana" "3000" "observability" "Grafana"

# Start Loki port-forward  
start_port_forward "svc/loki" "3100" "observability" "Loki"

# Wait a moment for them to start
sleep 3

echo -e "${GREEN}✅ SAGE Federation Port-Forwards Started!${NC}"
echo ""
echo -e "${BLUE}🌐 ACCESS POINTS:${NC}"
echo -e "   • ${GREEN}Grafana:${NC} http://localhost:3000 (admin/admin123)"
echo -e "   • ${GREEN}Loki:${NC} http://localhost:3100"
echo ""
echo -e "${YELLOW}💡 These will auto-restart if they fail!${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop all port-forwards${NC}"
echo ""

# Keep script running and show status
while true; do
    echo -e "${BLUE}📊 Status Check:${NC}"
    
    # Check Grafana
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Grafana: Running${NC}"
    else
        echo -e "   ${RED}❌ Grafana: Down${NC}"
    fi
    
    # Check Loki
    if curl -s http://localhost:3100/ready >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Loki: Running${NC}"
    else
        echo -e "   ${RED}❌ Loki: Down${NC}"
    fi
    
    echo ""
    sleep 30
done
