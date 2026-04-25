<?php

namespace App\Core\Base;

use App\Core\Database;

class BaseModel {
    protected $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    protected function fetchAll($stmt) {
        return $stmt->fetchAll() ?: [];
    }

    protected function fetch($stmt) {
        return $stmt->fetch() ?: null;
    }
}