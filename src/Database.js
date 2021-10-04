/* eslint-disable no-underscore-dangle */
const axios = require('axios');
const ProError = require('./Error.js');

class Database {
  constructor(authToken, serverId, embedName = 'probot.db') {
    if (
      typeof authToken !== 'string' ||
      typeof serverId !== 'string' ||
      typeof embedName !== 'string'
    ) {
      throw new ProError('authToken, serverId, embedName must be a string');
    }

    this.authToken = authToken;
    this.serverId = serverId;
    this.embedName = embedName;

    this.cache = null;
  }

  async get(key) {
    if (typeof key !== 'string') throw new ProError('Provided key must be a string');
    return (await this._read())[key];
  }

  async set(key, value) {
    if (typeof key !== 'string') throw new ProError('Provided key must be a string');
    const data = await this._read();
    data[key] = value;
    return this._write(data);
  }

  async push(key, element) {
    if (typeof key !== 'string') throw new ProError('Provided key must be a string');
    const arr = await this.get(key) || [];
    if (!Array.isArray(arr)) throw new ProError(`"${key}" is not an array!`);

    arr.push(element);
    return this.set(key, arr);
  }

  async delete(key) {
    if (typeof key !== 'string') throw new ProError('Provided key must be a string');
    const data = await this._read();
    delete data[key];
    return this._write(data);
  }

  async clear() {
    return this._write({});
  }

  async _read() {
    return this.cache || JSON.parse((await this._fetchEmbed()).content);
  }

  async _write(data) {
    const embed = await this._fetchEmbed();

    await axios({
      url: 'https://api.probot.io/',
      method: 'PUT',
      headers: {
        Authorization: this.authToken,
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      },
      data: {
        access: this.authToken,
        embed: {
          _id: embed._id,
          content: JSON.stringify(data),
          embed: {},
          guild: this.serverId,
          name: this.embedName,
        },
        guild_id: this.serverId,
        method: 'UPDATE_EMBED',
      },
    });

    this.cache = data;

    return true;
  }

  async _fetchEmbed() {
    let response = await axios({
      url: `https://api.probot.io/${this.serverId}/embeds`,
      headers: {
        Authorization: this.authToken,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      },
    });
    const embeds = response.data.filter((e) => e.name === this.embedName);

    if (embeds.length > 1) {
      throw new ProError(
        `There's more than one embed with the name "${this.embedName}"`,
      );
    }

    let embed = embeds[0];

    if (!embed) {
      response = await axios({
        url: 'https://api.probot.io/',
        method: 'PUT',
        headers: {
          Authorization: this.authToken,
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
        },
        data: {
          access: this.authToken,
          guild_id: this.serverId,
          method: 'ADD_EMBED',
        },
      });
      embed = response.data[response.data.length - 1];
    }

    if (!embed.content || embed.content.length === 0) {
      await axios({
        url: 'https://api.probot.io/',
        method: 'PUT',
        headers: {
          Authorization: this.authToken,
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
        },
        data: {
          access: this.authToken,
          embed: {
            _id: embed._id,
            content: '{}',
            embed: {},
            guild: this.serverId,
            name: this.embedName,
          },
          guild_id: this.serverId,
          method: 'UPDATE_EMBED',
        },
      });

      embed.content = '{}';
    }

    return embed;
  }
}

module.exports = Database;