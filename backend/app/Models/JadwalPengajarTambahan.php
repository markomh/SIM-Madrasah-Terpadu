<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class JadwalPengajarTambahan extends Pivot
{
    protected $table = 'jadwal_pengajar_tambahan';
    
    // Disable incrementing since this pivot uses composite primary keys
    public $incrementing = false;
}
