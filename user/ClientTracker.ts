// Initialize activeClients
let activeClients = 0;
console.log('active clients : ',activeClients)
// Export as an object so the reference remains consistent
module.exports = {
  getActiveClients: () => {
   
   return activeClients 
} ,
  increment: () => {
    
    activeClients++; console.log('active clients : ',activeClients)
 },
  decrement: () => {
  activeClients-- ; console.log('active clients : ',activeClients)
 }
};