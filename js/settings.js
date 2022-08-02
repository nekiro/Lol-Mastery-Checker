const { app } = require('electron');
const path = require('path');
const fs = require('fs/promises');

class Settings {
  constructor() {
    this.settings = new Map();
  }

  get(key) {
    return this.settings.get(key);
  }
  set(key, value) {
    this.settings.set(key, value);
  }

  async load() {
    try {
      const settings = JSON.parse(
        await fs.readFile(
          path.join(app.getPath('appData'), app.getName(), 'config.json')
        )
      );

      this.settings = new Map(settings);
    } catch (err) {}
  }

  async save() {
    try {
      await fs.writeFile(
        path.join(app.getPath('appData'), app.getName(), 'config.json'),
        JSON.stringify(Array.from(this.settings.entries()))
      );
    } catch (err) {}
  }
}

module.exports = Settings;
