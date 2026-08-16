<?php

namespace Tests\Feature\Auth;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PersonaCapabilityTest
 *
 * Menguji diferensiasi capability flags antar persona (Kamad, Admin, Operator, BK, Guru, Wali Kelas, Multi-Role).
 * Memastikan tidak ada capability yang bocor atau bernilai sama secara seragam.
 */
class PersonaCapabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /** @test */
    public function persona_kamad_murni_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'kamad@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', true)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', false)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', false);
    }

    /** @test */
    public function persona_admin_murni_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'admin@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', false)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', true)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', false)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', false);
    }

    /** @test */
    public function persona_operator_murni_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'operator@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', false)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', true)
            ->assertJsonPath('data.capabilities.isGuruBk', false)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', false);
    }

    /** @test */
    public function persona_guru_bk_murni_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'bk@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', false)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', true)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', false);
    }

    /** @test */
    public function persona_guru_mapel_murni_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'guru@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', false)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', false)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', true);
    }

    /** @test */
    public function persona_wali_kelas_menghasilkan_capabilities_eksklusif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'walikelas@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', false)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', false)
            ->assertJsonPath('data.capabilities.isWaliKelas', true)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', false)
            ->assertJsonPath('data.capabilities.isPengajarAktif', true);
    }

    /** @test */
    public function persona_multi_role_menghasilkan_gabungan_capabilities_secara_aditif(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'demo@mts-terpadu.sch.id',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.capabilities.isKepalaMadrasah', true)
            ->assertJsonPath('data.capabilities.isAdminMadrasah', false)
            ->assertJsonPath('data.capabilities.isOperatorKesiswaan', false)
            ->assertJsonPath('data.capabilities.isGuruBk', true)
            ->assertJsonPath('data.capabilities.isWaliKelas', false)
            ->assertJsonPath('data.capabilities.isPembinaEkstrakurikuler', true)
            ->assertJsonPath('data.capabilities.isPengajarAktif', true);
    }
}
