#!/bin/bash

echo "Checking what's using port 3001..."
echo ""

# Check with netstat
echo "=== NETSTAT OUTPUT ==="
netstat -tulpn | grep :3001 || echo "No processes found with netstat"
echo ""

# Check with lsof
echo "=== LSOF OUTPUT ==="
lsof -i :3001 || echo "No processes found with lsof"
echo ""

# Check with ss
echo "=== SS OUTPUT ==="
ss -tulpn | grep :3001 || echo "No processes found with ss"
echo ""

# Check for any node processes
echo "=== NODE PROCESSES ==="
ps aux | grep node | grep -v grep || echo "No node processes found"
echo ""

# Check for any processes with "backend" in name
echo "=== BACKEND PROCESSES ==="
ps aux | grep backend | grep -v grep || echo "No backend processes found"
echo ""

echo "If you find the PID of the process using port 3001, kill it with:"
echo "sudo kill -9 <PID>"