import prompts from "prompts"
import { getConfigStore } from './get-config-store';

export async function interactForServerSelection() {
  const servers = ["http://localhost:3020", "https://connect.getseam.com"]

  const { server } = await prompts([
    {
      type: 'select',
      name: 'server',
      message: 'Select a server:',
      choices: servers.map(server => ({ title: server, value: server })),
    }
  ]);

  const config = getConfigStore();
  config.set('server', server);
  console.log(`Server set to ${server}`);
}
