<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProtocolCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function protocols()
    {
        return $this->hasMany(VaccineProtocol::class, 'protocol_category_id');
    }
}
