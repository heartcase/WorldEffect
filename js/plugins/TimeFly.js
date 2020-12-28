{
  let frames = 0;

  const tick = () => {
    frames += 1;
  };

  const display = () => frames;

  const displayTime = (ratio) => {
    const seconds = (frames / 60) * ratio;
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, 0);
    const m = Math.floor(((seconds - s) / 60) % 60)
      .toString()
      .padStart(2, 0);
    const h = Math.floor(((seconds - m - s) / 60 / 60) % 24)
      .toString()
      .padStart(2, 0);
    return `${h}:${m}:${s}`;
  };

  // overwrite
  const update = Game_Map.prototype.update;
  Game_Map.prototype.update = function (sceneActive) {
    update.call(this, sceneActive);
    if (!this._interpreter.isRunning()) tick();
  };

  const createGameObjects = DataManager.createGameObjects;
  DataManager.createGameObjects = () => {
    createGameObjects();
    frames = 0;
  };

  const makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = () => {
    const contents = makeSaveContents();
    contents.frames = frames;
    return contents;
  };

  const extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = (contents) => {
    extractSaveContents(contents);
    frames = contents.frames;
  };

  window.TimeFly = {
    tick,
    display,
    displayTime,
  };
}
