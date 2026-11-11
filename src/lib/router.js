// Jednoduchý router: tabulka rout { method, path, handler } a parametry ve tvaru :id.

function splitPath(path) {
  return path.split('/').filter(Boolean);
}

function matchSegments(routeSegments, pathSegments) {
  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const pathSegment = pathSegments[i];

    if (routeSegment.startsWith(':')) {
      try {
        params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
      } catch {
        return null;
      }
    } else if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function createRouter(routes) {
  const compiled = routes.map((route) => ({
    ...route,
    method: route.method.toUpperCase(),
    segments: splitPath(route.path)
  }));

  // Vrátí { handler, params }, nebo null, když žádná routa neodpovídá.
  function match(method, pathname) {
    const pathSegments = splitPath(pathname);

    for (const route of compiled) {
      if (route.method !== method) {
        continue;
      }
      const params = matchSegments(route.segments, pathSegments);
      if (params) {
        return { handler: route.handler, params };
      }
    }

    return null;
  }

  return { match };
}
