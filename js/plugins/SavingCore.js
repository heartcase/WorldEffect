// 序列化核心
{
  const namespaces = [];
  const registerNamespace = namespaces.push.bind(namespaces);
  const isPrimitive = (o) => o !== Object(o);
  const encode = (value, circular) => {
    if (!isPrimitive(value)) {
      circular.push(value);
      value['@constructor'] = value.constructor.name;
      value['@circularID'] = circular.length - 1;
      for (const key in value) {
        if (circular.includes(value[key])) {
          value[key] = { '@reference': value[key]['@circularID'] };
        } else {
          encode(value[key], circular);
        }
      }
    }
  };

  const stringify = (value) => {
    const circular = [];
    encode(value, circular);
    const string = JSON.stringify(value);
    restoreObject(value, circular);
    return string;
  };

  const restoreObject = (value, circular) => {
    if (!isPrimitive(value)) {
      delete value['@constructor'];
      delete value['@circularID'];
      for (const key in value) {
        const circularID = value[key]?.['@reference'];
        if (circularID !== undefined) {
          value[key] = circular[circularID];
        } else {
          restoreObject(value[key], circular);
        }
      }
    }
  };

  const parse = (string) => {
    const value = JSON.parse(string);
    const circular = [];
    decode(value, circular);
    return value;
  };

  const getConstructor = (name) => {
    const constructor = namespaces.find((namespace) =>
      namespace.hasOwnProperty(name),
    )[name];
    if (constructor) {
      return constructor;
    }
    return Object;
  };

  const decode = (value, circular) => {
    if (!isPrimitive(value)) {
      circular[value['@circularID']] = value;
      if (value instanceof Array === false) {
        const constructor = getConstructor(value['@constructor']);
        Object.setPrototypeOf(value, constructor['prototype']);
        delete value['@constructor'];
        delete value['@circularID'];
      }
      for (const key in value) {
        const circularID = value[key]?.['@reference'];
        if (circularID !== undefined) {
          value[key] = circular[circularID];
        } else {
          decode(value[key], circular);
        }
      }
    }
  };

  window.SavingCore = { registerNamespace, stringify, parse };
}
