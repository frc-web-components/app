import NetworkTablesDialog from './networktables-dialog.js';


const ntDialog = new NetworkTablesDialog();

export function openModal() {
  ntDialog.open();
}