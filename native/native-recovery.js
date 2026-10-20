/* Explicit Android document export for the legacy catalog vault's five recovery shares. */
(() => {
  'use strict';
  const words={
    scope:['Diese Ersatzschlüssel gelten nur für diesen Tresor, nicht für das Passwort des verschlüsselten Speicherorts.','These recovery keys apply only to this vault, not to the encrypted storage location password.','Эти ключи относятся только к этому сейфу, а не к паролю зашифрованного хранилища.','Te klucze dotyczą tylko tego sejfu, a nie hasła zaszyfrowanego miejsca przechowywania.'],
    saving:['5 Ersatzschlüssel erzeugt. Wähle jetzt eine Datei zum Speichern.','5 recovery keys generated. Choose where to save the file.','Созданы 5 запасных ключей. Выберите файл для сохранения.','Wygenerowano 5 kluczy zapasowych. Wybierz plik do zapisania.'],
    saved:['Alle 5 Ersatzschlüssel gespeichert. Bewahre sie getrennt auf und bestätige die Sicherung.','All 5 recovery keys saved. Store them separately and confirm the backup.','Все 5 ключей сохранены. Храните их отдельно и подтвердите сохранение.','Zapisano wszystkie 5 kluczy. Przechowuj je osobno i potwierdź zapis.'],
    cancelled:['Speichern abgebrochen. Die Schlüssel sind noch nicht gesichert. Erneut herunterladen.','Saving cancelled. The keys are not backed up yet. Download again.','Сохранение отменено. Ключи ещё не сохранены. Скачайте повторно.','Anulowano zapis. Klucze nie są zabezpieczone. Pobierz ponownie.'],
    failed:['Schlüssel konnten nicht gespeichert werden. Speicherort prüfen und erneut versuchen.','Unable to save recovery keys. Check the location and try again.','Не удалось сохранить ключи. Проверьте место сохранения и повторите.','Nie można zapisać kluczy. Sprawdź miejsce zapisu i spróbuj ponownie.'],
    changed:['Passwort geändert. Erzeuge und sichere neue Ersatzschlüssel.','Password changed. Generate and save new recovery keys.','Пароль изменён. Создайте и сохраните новые ключи.','Zmieniono hasło. Wygeneruj i zapisz nowe klucze.']
  };
  window.PBRecoveryExport={
    text(key){const index=Math.max(0,['de','en','ru','pl'].indexOf(document.documentElement.lang));return words[key][index];},
    async save(shares,name,heading){
      const api=window.Capacitor?.Plugins?.ProFiles;
      if(typeof api?.saveRecoveryKeys!=='function')throw new Error('RECOVERY_EXPORT_UNAVAILABLE');
      return api.saveRecoveryKeys({shares,name,heading});
    }
  };
})();
