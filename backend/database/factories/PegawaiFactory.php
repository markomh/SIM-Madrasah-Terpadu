<?php

namespace Database\Factories;

use App\Models\Pegawai;
use App\Models\Madrasah;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class PegawaiFactory extends Factory
{
    protected $model = Pegawai::class;

    public function definition(): array
    {
        return [
            'id_madrasah'        => Madrasah::factory(), 
            'nik'                => $this->faker->unique()->numerify('################'),
            'nip'                => $this->faker->unique()->numerify('##################'),
            'nama_lengkap_gelar' => $this->faker->name() . ', S.Pd.',
            'status_kepegawaian' => 'Guru Tetap',
            'tugas_utama'        => 'Guru',
            'email'              => $this->faker->unique()->safeEmail(),
            'password'           => Hash::make('password123'),
        ];
    }
}