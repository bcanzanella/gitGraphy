import * as vscode from 'vscode';
import * as path from 'path';
import Constants from '../../utils/constants';

export default class CommitsPanel {
  public static currentPanel: CommitsPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(commitsPerAuthor: CommitsPerAuthor[], config: GraphConfig , context:vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (CommitsPanel.currentPanel) {
      CommitsPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel("CommitsPanel", "CommitsPerAuthor", column || vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    const ChartJSFilePath = vscode.Uri.file(
      path.join(context.extensionPath, 'resources', 'Chart.bundle.min.js')
    );

    const ChartJSSrc = ChartJSFilePath.with({ scheme: 'vscode-resource' });
    CommitsPanel.currentPanel = new CommitsPanel(panel, commitsPerAuthor, config, ChartJSSrc);
  }

  private constructor(panel: vscode.WebviewPanel, commitsPerAuthor:any, config:any, ChartJSSrc: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel = panel;
    const webViewContent = this.getWebviewContent(commitsPerAuthor, config, ChartJSSrc);
    this._panel.webview.html = webViewContent;
  }

  private compileUserCommitsInfo(commit:any): string{
    return `'${commit.author}: ${commit.totalCommits} commits - ${commit.percentageOfAllCommits}%'`;
  }

  private getWebviewContent(commitsPerAuthor: any | [], config:any, ChartJSSrc: vscode.Uri) {
    const labels = commitsPerAuthor.map((commit:any) => this.compileUserCommitsInfo(commit));
    const data = (commitsPerAuthor.map((commit:any) => commit.totalCommits).toString());
    const bodyStyle = (config.width > 0 && config.height >0) ? `body { width:  ${config.width}px; height: ${config.height}px}` : '';
    return `<!DOCTYPE html>
          <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Signin</title>
            </head>
            <body>
              <canvas id="myChart"></canvas>
              <script src="${ChartJSSrc}"></script>
              <script>
                const vscode = acquireVsCodeApi();
                (function init() {
                  document.vscode = vscode;
                })();
              </script>
              <script>
                var ctx = document.getElementById('myChart');
                var chart = new Chart(ctx, {
                  type: 'pie',
                  data: {
                    labels: [${labels}],
                    datasets: [{
                        data: [${data}],
                        borderWidth: 2,
                        backgroundColor: ${Constants.colors}
                    }]
                  },
                  options: {
                    maintainAspectRatio: true,
                    backgroundColor: '#c1c1c1',
                    responsive: true,
                    legend: {
                      display: ${config.showLegend},
                      position: '${config.legendPosition}',
                    }
                  }
                });
              </script>
            </body>
            <br />
            <br />
            <style>
              ${bodyStyle}
              body.vscode-light .username, body.vscode-light .password {
                color: #616466;
              }
              body.vscode-dark .username, body.vscode-dark .password {
                color: #C2C7CC;
              }
            </style>
          </html>`;
  }
  
    public dispose() {
      CommitsPanel.currentPanel = undefined;
      // Clean up our resources
      this._panel.dispose();
  
      while (this._disposables.length) {
        const panel = this._disposables.pop();
        if (panel) {
          panel.dispose();
        }
      }
    }
}