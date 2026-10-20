package de.familyprojekt.privatebrain.pro;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import javax.net.SocketFactory;

/** Track the raw transport before connect. JavaMail retains its default TLS and hostname checks. */
final class AppSocketFactory extends SocketFactory {
    @Override public Socket createSocket() throws IOException { AppNetwork.check();return AppNetwork.track(new Socket()); }
    private Socket connect(String host,int port,InetAddress local,int localPort) throws IOException {
        Socket socket = createSocket();
        try {
            if (local != null) socket.bind(new InetSocketAddress(local,localPort));
            AppNetwork.check();socket.connect(new InetSocketAddress(host,port),20000);return socket;
        } catch(IOException error) { try { socket.close(); } catch(IOException ignored) { }throw error; }
    }
    @Override public Socket createSocket(String host,int port) throws IOException { return connect(host,port,null,0); }
    @Override public Socket createSocket(String host,int port,InetAddress local,int localPort) throws IOException { return connect(host,port,local,localPort); }
    @Override public Socket createSocket(InetAddress host,int port) throws IOException { return connect(host.getHostAddress(),port,null,0); }
    @Override public Socket createSocket(InetAddress host,int port,InetAddress local,int localPort) throws IOException { return connect(host.getHostAddress(),port,local,localPort); }
}
