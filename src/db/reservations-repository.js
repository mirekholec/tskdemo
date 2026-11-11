// Jediné místo v aplikaci s SQL dotazy. Všechny dotazy jsou parametrizované.

function toReservation(row) {
  return {
    id: row.id,
    date: row.date,
    hour: row.hour,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at
  };
}

export function createReservationsRepository(db) {
  const statements = {
    countBySlot: db.prepare('SELECT COUNT(*) AS count FROM reservations WHERE date = ? AND hour = ?'),
    countsByDate: db.prepare('SELECT hour, COUNT(*) AS count FROM reservations WHERE date = ? GROUP BY hour'),
    insert: db.prepare('INSERT INTO reservations (date, hour, name, phone) VALUES (?, ?, ?, ?)'),
    listFrom: db.prepare(
      'SELECT id, date, hour, name, phone, created_at FROM reservations WHERE date >= ? ORDER BY date, hour, id'
    ),
    deleteById: db.prepare('DELETE FROM reservations WHERE id = ?'),
    deleteAll: db.prepare('DELETE FROM reservations')
  };

  return {
    countBySlot(date, hour) {
      return statements.countBySlot.get(date, hour).count;
    },

    // Vrací Map: hodina → počet rezervací
    countsByDate(date) {
      const rows = statements.countsByDate.all(date);
      return new Map(rows.map((row) => [row.hour, row.count]));
    },

    insert({ date, hour, name, phone }) {
      const result = statements.insert.run(date, hour, name, phone);
      return Number(result.lastInsertRowid);
    },

    listFrom(date) {
      return statements.listFrom.all(date).map(toReservation);
    },

    deleteById(id) {
      return statements.deleteById.run(id).changes > 0;
    },

    // Smaže všechny rezervace (používá seed), vrací počet smazaných
    deleteAll() {
      return Number(statements.deleteAll.run().changes);
    },

    // Spustí funkci v transakci se zámkem pro zápis (BEGIN IMMEDIATE)
    transaction(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  };
}
