{
  const storyRecords = {};
  const stageRecords = {};
  const checkpointRecords = {};

  const STATUS = {
    INACTIVE: 'inactive',
    STARTED: 'started',
    COMPLETED: 'completed',
    FAILED: 'failed',
    UNCHANGED: 'unchanged',
  };

  const { INACTIVE, STARTED, COMPLETED, FAILED, UNCHANGED } = STATUS;

  // Entity

  const createStory = (storyName, stageName = null, status = INACTIVE) => {
    if (stageName && !stageRecords[stageName]) createStage(stageName);
    storyRecords[storyName] = {
      name: storyName,
      stageName,
      status,
      routeMap: [],
    };
    return storyRecords[storyName];
  };

  const createStage = (stageName) => {
    stageRecords[stageName] = {
      name: stageName,
      progresses: [],
      routeMap: [],
    };
    return stageRecords[stageName];
  };

  const createCheckpoint = (checkpointName) => {
    checkpointRecords[checkpointName] = {
      name: checkpointName,
      value: false,
    };
    return checkpointRecords[checkpointName];
  };

  // Get Data
  const getCheckpointValue = (checkpointName) => {
    const checkpoint = checkpointRecords[checkpointName];
    return checkpoint.value;
  };

  const getStoryStage = (storyName) => {
    const story = storyRecords[storyName];
    return story.stageName;
  };

  const getStoryStatus = (storyName) => {
    const story = storyRecords[storyName];
    return story.status;
  };
  // Update
  const updateStage = (story) => {
    // Switch storyline
    {
      const { nextStageName, status } =
        story.routeMap.find((route) =>
          route.checkpointNames.every(getCheckpointValue),
        ) || {};
      if (nextStageName) {
        story.stageName = nextStageName;
        if (status !== UNCHANGED) {
          story.status = status;
        }
        return;
      }
    }
    // Process Stage
    {
      const stage = stageRecords[story.stageName];
      const { nextStageName, status } =
        stage.routeMap.find((route) =>
          route.checkpointNames.every(getCheckpointValue),
        ) || {};
      if (nextStageName) {
        story.stageName = nextStageName;
        if (status !== UNCHANGED) {
          story.status = status;
        }
      }
    }
  };

  const setStoryStage = (storyName, stageName) => {
    const story = storyRecords[storyName];
    story.stageName = stageName;
    updateStage(story);
  };

  const setCheckpointValue = (checkpointName, value) => {
    const checkpoint = checkpointRecords[checkpointName];
    checkpoint.value = value;
    for (const storyName in storyRecords) {
      const story = storyRecords[storyName];
      if (story.status === STARTED) {
        updateStage(story);
      }
    }
  };

  const setStoryStatus = (storyName, status) => {
    const story = storyRecords[storyName];
    story.status = status;
    updateStage(story);
  };

  const setNextStage = (
    stageName,
    nextStageName,
    checkpointNames,
    status = UNCHANGED,
    priority = -1,
  ) => {
    if (stageName && !stageRecords[stageName]) createStage(stageName);
    const stage = stageRecords[stageName];
    checkpointNames.forEach((checkpointName) => {
      if (!checkpointRecords[checkpointName]) {
        createCheckpoint(checkpointName);
      }
    });
    stage.routeMap.push({
      priority,
      checkpointNames,
      nextStageName,
      status,
    });
    stage.routeMap.sort((a, b) => a.priority - b.priority);
  };

  const setNextStoryline = (
    storyName,
    nextStageName,
    checkpointNames,
    status = UNCHANGED,
    priority = -1,
  ) => {
    const story = storyRecords[storyName];
    checkpointNames.forEach((checkpointName) => {
      if (!checkpointRecords[checkpointName]) {
        createCheckpoint(checkpointName);
      }
    });
    story.routeMap.push({
      priority,
      checkpointNames,
      nextStageName,
      status,
    });
    story.routeMap.sort((a, b) => a.priority - b.priority);
  };

  // Serialization

  const clearData = () => {
    for (const key in storyRecords) {
      delete storyRecords[key];
    }
    for (const key in stageRecords) {
      delete storyRecords[key];
    }
    for (const key in checkpointRecords) {
      delete storyRecords[key];
    }
  };

  {
    const temp = DataManager.createGameObjects;
    DataManager.createGameObjects = () => {
      temp();
      clearData();
    };
  }
  {
    const temp = DataManager.makeSaveContents;
    DataManager.makeSaveContents = () => {
      const contents = temp();
      contents.stories = { storyRecords, stageRecords, checkpointRecords };
      return contents;
    };
  }
  {
    const temp = DataManager.extractSaveContents;
    DataManager.extractSaveContents = (contents) => {
      temp(contents);
      clearData();
      const stories = contents.stories;
      Object.assign(storyRecords, stories.storyRecords);
      Object.assign(stageRecords, stories.stageRecords);
      Object.assign(checkpointRecords, stories.checkpointRecords);
    };
  }

  window.Storyline = {
    storyRecords,
    stageRecords,
    checkpointRecords,
    STATUS,
    createStory,
    createStage,
    createCheckpoint,
    getCheckpointValue,
    getStoryStage,
    getStoryStatus,
    updateStage,
    setStoryStage,
    setNextStage,
    setCheckpointValue,
    setStoryStage,
    setNextStage,
    setNextStoryline,
    clearData,
  };
}
