# Local Domain Setup for RepoPulse

This guide explains how to access your RepoPulse app at http://repopulse.loc in your browser, without needing to specify a port.

---

## 🖥️ macOS / Linux

1. **Add a local DNS record:**

   Open a terminal and run:
   ```sh
   grep -q "127.0.0.1 repopulse.loc" /etc/hosts || echo "127.0.0.1 repopulse.loc" | sudo tee -a /etc/hosts
   ```
   This will map `repopulse.loc` to your local machine.

2. **Run the Docker container on port 80:**
   ```sh
   sudo docker run -d -p 80:80 repopulse
   ```
   > **Note:** Port 80 is privileged, so you may need `sudo`.

3. **Access the app:**
   - Open [http://repopulse.loc](http://repopulse.loc) in your browser.

---

## 🖥️ Windows

1. **Add a local DNS record:**

   - Open Notepad as Administrator.
   - Open the file: `C:\Windows\System32\drivers\etc\hosts`
   - Add this line at the end:
     ```
     127.0.0.1 repopulse.loc
     ```
   - Save the file.

2. **Run the Docker container on port 80:**
   ```cmd
   docker run -d -p 80:80 repopulse
   ```

3. **Access the app:**
   - Open [http://repopulse.loc](http://repopulse.loc) in your browser.

---

## 📝 Notes
- Make sure no other service is using port 80 on your machine.
- You can remove the hosts entry later if you no longer need it.
- This setup is for local development only. 