import { useState, useCallback } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SeriesSelector } from "@/components/SeriesSelector";
import { getSeriesFromURL, type SeriesId } from "@/lib/series-config";
import { getSeriesConfig } from "@/lib/series-registry";

function Router() {
  const [activeSeries, setActiveSeries] = useState<SeriesId>(getSeriesFromURL);

  const handleSeriesChange = useCallback((series: SeriesId) => {
    setActiveSeries(series);
    const url = new URL(window.location.href);
    if (series === 'naruto') {
      url.searchParams.delete('s');
    } else {
      url.searchParams.set('s', series);
    }
    url.searchParams.delete('mode');
    url.searchParams.delete('p');
    url.searchParams.delete('bp');
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  }, []);

  const config = getSeriesConfig(activeSeries);

  return (
    <Switch>
      <Route path={"/"}>
        <SeriesSelector activeSeries={activeSeries} onSeriesChange={handleSeriesChange} />
        <Home key={config.id} config={config} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
