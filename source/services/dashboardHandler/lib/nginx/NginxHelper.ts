/**
 * Nginx helper class for nginx workloads
 */
import { CWHelper, WidgetFactory } from "../CWHelperAbstract";
import { ILogWidget, IMetricWidget, IExplorerWidget } from "../generics";

class NginxWidgets implements WidgetFactory {
  widgets(): (ILogWidget | IMetricWidget | IExplorerWidget)[] {
    // update this method as needed to return list of widgets for nginx workload
    return [];
  }
}

export class Nginx extends CWHelper {
  factoryMethod() {
    return new NginxWidgets();
  }
}
