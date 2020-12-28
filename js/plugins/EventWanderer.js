/*:
 * @target MZ
 */

{
  const eventMapId = 2;
  const filename = `Map${eventMapId.padZero(3)}.json`;
  DataManager._databaseFiles.push({ name: '$dataEventMap', src: filename });

  class Game_DynamicEvent extends Game_Event {
    event() {
      return window.$dataEventMap.events[this._eventId];
    }
  }

  const $gameEvents = [];
  const createDynamicEventData = (mapId, eventId) => {
    const eventData = {
      eventId,
      mapId,
    };
    $gameEvents.push(eventData);
  };

  const setupEvents = Game_Map.prototype.setupEvents;
  Game_Map.prototype.setupEvents = function () {
    setupEvents.call(this);
    $gameEvents
      .filter(Boolean)
      .filter((event) => event.mapId === this._mapId)
      .forEach((event) => {
        let eventId = this._events.length;
        this._events[eventId] = new Game_DynamicEvent(
          this._mapId,
          event.eventId,
        );
      });
  };

  // usage: createDynamicEventData(1, 1);
}
