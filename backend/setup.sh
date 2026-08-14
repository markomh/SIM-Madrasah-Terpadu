#!/bin/bash
# =============================================================================
# SIM Madrasah Terpadu — Backend Setup Script
# Jalankan setelah `docker-compose up -d` berhasil
# =============================================================================

set -e

echo "⏳ Menunggu PostgreSQL siap..."
sleep 5

echo "📦 Install dependencies..."
docker exec sim_madrasah_app composer install --no-interaction

echo "🔑 Copy .env dan generate key..."
docker exec sim_madrasah_app cp .env.example .env
docker exec sim_madrasah_app php artisan key:generate

echo "🗃️  Jalankan migrasi..."
docker exec sim_madrasah_app php artisan migrate --force

echo "🌱 Seed data demo (2 madrasah, pegawai rangkap jabatan)..."
docker exec sim_madrasah_app php artisan db:seed --force

echo "⚡ Cache config dan routes..."
docker exec sim_madrasah_app php artisan config:cache
docker exec sim_madrasah_app php artisan route:cache

echo ""
echo "✅ Backend SIM Madrasah siap!"
echo ""
echo "📌 Endpoint:"
echo "   API Base URL : http://localhost:8080/api/v1"
echo ""
echo "📌 Akun demo:"
echo "   Madrasah 1 (Kamad+BK): demo@mts-terpadu.sch.id / password"
echo "   Madrasah 2 (Kamad):    kamad@ma-alhikmah.sch.id / password"
echo ""
echo "📌 Jalankan test:"
echo "   docker exec sim_madrasah_app php artisan test"
