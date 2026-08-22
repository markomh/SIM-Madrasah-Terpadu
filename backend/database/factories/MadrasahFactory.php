<?php

namespace Database\Factories;

use App\Models\Madrasah;
use Illuminate\Database\Eloquent\Factories\Factory;

class MadrasahFactory extends Factory
{
    protected $model = Madrasah::class;

    public function definition(): array
    {
        return [
            'nama_madrasah' => 'Madrasah ' . $this->faker->company(),
            'npsn'          => $this->faker->unique()->numerify('########'),
            'status_aktif'  => true,
        ];
    }
}